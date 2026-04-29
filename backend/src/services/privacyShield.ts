import crypto from 'crypto';

const PII_PATTERNS: Record<string, RegExp> = {
  saudi_id: /\b[12]\d{9}\b/g,
  saudi_phone: /(\+966|00966|0)(5\d{8})\b/g,
  email: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
  iban: /\bSA\d{22}\b/g,
  credit_card: /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g,
  passport: /\b[A-Z][0-9]{8}\b/g,
};

export interface RedactedItem {
  type: string;
  position: { start: number; end: number };
  replacement: string;
}

export interface RedactionReport {
  originalHash: string;
  redactedText: string;
  redactedItems: RedactedItem[];
  redactionCount: number;
}

function hashSHA256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function redactPII(text: string): RedactionReport {
  const redactedItems: RedactedItem[] = [];

  // Collect all matches with positions before any replacement
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      redactedItems.push({
        type,
        position: { start: match.index, end: match.index + match[0].length },
        replacement: `[${type.toUpperCase()}_REDACTED]`,
      });
    }
  }

  // Sort by position descending so replacements don't shift offsets
  redactedItems.sort((a, b) => b.position.start - a.position.start);

  let redactedText = text;
  for (const item of redactedItems) {
    redactedText =
      redactedText.slice(0, item.position.start) +
      item.replacement +
      redactedText.slice(item.position.end);
  }

  return {
    originalHash: hashSHA256(text),
    redactedText,
    redactedItems: redactedItems.sort((a, b) => a.position.start - b.position.start),
    redactionCount: redactedItems.length,
  };
}

export function containsPII(text: string): boolean {
  for (const pattern of Object.values(PII_PATTERNS)) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return true;
  }
  return false;
}
