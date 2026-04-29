import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Prompt injection patterns (Phase 8) ───────────────────────────────────
// OCR text and user messages are untrusted — strip known injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/gi,
  /system\s+prompt/gi,
  /jailbreak/gi,
  /you\s+are\s+now\s+(a|an|the)\s+\w+/gi,
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/g,
  /\bDAN\b/g, // "Do Anything Now" jailbreak
  /disregard\s+(all\s+)?(previous|prior|your)/gi,
  /act\s+as\s+if\s+you\s+(have\s+no|are\s+not)/gi,
];

export function sanitizeForPrompt(text: string): string {
  let sanitized = text;
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  // Limit length to prevent context-flooding attacks
  return sanitized.slice(0, 4000);
}

const SYSTEM_PROMPT = `You are an expert UI automation analyst. You receive OCR data from a sequence of screen recording frames and must output a precise JSON workflow that can be replayed by Playwright browser automation.

Rules:
1. Identify state CHANGES between consecutive frames — changes indicate user actions
2. Infer the ACTION TYPE from the change (click changed selection → 'click', new text appeared in input → 'type', URL changed → 'navigate', etc.)
3. Use TEXT-BASED locators only, never pixel coordinates
4. Extract all data values that change as VARIABLES using {{variable_name}} syntax
5. Add retry_count: 2 and timeout_ms: 5000 to every step by default
6. Group repeated patterns and suggest loop blocks
7. Output ONLY valid JSON matching the WorkflowStep[] schema — no markdown, no explanation

OUTPUT FORMAT: JSON array of WorkflowStep objects only.

WorkflowStep schema:
{
  step_id: number,
  action: 'click'|'type'|'extract'|'navigate'|'press'|'wait'|'scroll'|'screenshot'|'hover',
  target_type?: 'text'|'placeholder'|'text_relative'|'aria'|'xpath'|'css',
  target_value?: string,
  reference_text?: string,
  variable_name?: string,
  input_value?: string,
  target_key?: string,
  target_url?: string,
  description: string,
  timeout_ms?: number,
  retry_count?: number,
  on_failure?: 'stop'|'continue'|'retry'
}`;

export interface FrameOCRResult {
  frame_index: number;
  timestamp_sec: number;
  elements: {
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    confidence: number;
    type: 'button' | 'input' | 'link' | 'text' | 'label';
  }[];
}

export async function analyzeFrameSequence(
  frames: FrameOCRResult[],
  enhancementHints?: string
): Promise<unknown[]> {
  const frameDiffs = buildFrameDiffs(frames);

  const userPrompt = `Analyze this screen recording sequence (${frames.length} frames):

FRAME CHANGES:
${sanitizeForPrompt(frameDiffs)}

${enhancementHints ? `Additional context from user: ${sanitizeForPrompt(enhancementHints)}` : ''}

Generate the complete Workflow JSON steps array for this automation task. Output ONLY the JSON array.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.1,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected LLM response type');

  const rawText = content.text.trim();
  const jsonText = extractJSON(rawText);

  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    const fixMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: rawText },
        { role: 'user', content: 'Fix the JSON syntax errors. Output ONLY the valid JSON array.' },
      ],
    });
    const fixContent = fixMessage.content[0];
    if (fixContent.type !== 'text') throw new Error('LLM fix response failed');
    return JSON.parse(extractJSON(fixContent.text.trim()));
  }
}

export async function aiAssist(
  workflow: unknown,
  message: string,
  context?: string
): Promise<{ response: string; suggested_steps?: unknown[]; modified_workflow?: unknown }> {
  const systemPrompt = `You are a workflow automation expert helping users build browser automation scripts.
You have access to the current workflow JSON. When the user asks to modify the workflow,
output the exact JSON changes needed. Be concise and practical.

When suggesting new steps, output them in this format:
{ "response": "your explanation", "suggested_steps": [...steps...] }

When modifying the whole workflow:
{ "response": "your explanation", "modified_workflow": {...workflow...} }

When just answering a question:
{ "response": "your answer" }

Always output valid JSON.`;

  // Phase 8: sanitize user-controlled inputs before injecting into prompt
  const safeMessage = sanitizeForPrompt(message);
  const safeContext = context ? sanitizeForPrompt(context) : undefined;

  const userPrompt = `Current workflow: ${JSON.stringify(workflow, null, 2)}

${safeContext ? `Context: ${safeContext}\n` : ''}User request: ${safeMessage}`;

  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = resp.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  try {
    return JSON.parse(extractJSON(content.text.trim()));
  } catch {
    return { response: content.text.trim() };
  }
}

function buildFrameDiffs(frames: FrameOCRResult[]): string {
  const diffs: string[] = [];
  for (let i = 0; i < frames.length - 1; i++) {
    const curr = frames[i];
    const next = frames[i + 1];
    const currTexts = new Set(curr.elements.map((e) => e.text));
    const nextTexts = new Set(next.elements.map((e) => e.text));

    const appeared = [...nextTexts].filter((t) => !currTexts.has(t));
    const disappeared = [...currTexts].filter((t) => !nextTexts.has(t));

    if (appeared.length > 0 || disappeared.length > 0) {
      diffs.push(
        `Frame ${i} → Frame ${i + 1} (t=${curr.timestamp_sec}s → ${next.timestamp_sec}s):` +
          (appeared.length ? `\n  Appeared: ${appeared.slice(0, 5).join(', ')}` : '') +
          (disappeared.length ? `\n  Disappeared: ${disappeared.slice(0, 5).join(', ')}` : '')
      );
    }
  }
  return diffs.join('\n\n') || 'No significant changes detected between frames.';
}

function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const arrStart = text.indexOf('[');
  const objStart = text.indexOf('{');
  if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
    return text.slice(arrStart, text.lastIndexOf(']') + 1);
  }
  if (objStart !== -1) {
    return text.slice(objStart, text.lastIndexOf('}') + 1);
  }
  return text;
}
