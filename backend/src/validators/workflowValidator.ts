import { z } from 'zod';

const stepSchema = z.object({
  step_id: z.number().min(1),
  action: z.enum(['navigate', 'click', 'type', 'extract', 'press', 'wait', 'scroll', 'hover', 'webhook', 'branch']),
  target: z.object({
    strategy: z.enum(['text_content', 'css_selector', 'xpath', 'role', 'placeholder', 'test_id', 'aria_label']),
    value: z.string().min(1),
    timeout_ms: z.number().min(100).max(60000).optional(),
    retry_count: z.number().min(0).max(10).optional()
  }).optional(),
  target_url: z.string().url().optional(),
  input_value: z.string().optional(),
  stealth: z.object({
    humanize: z.boolean().optional(),
    bezier_curves: z.boolean().optional(),
    typing_speed_wpm: z.number().min(20).max(120).optional()
  }).optional()
});

const workflowSchema = z.object({
  workflow_title: z.string().min(1).max(200),
  start_url: z.string().url(),
  session_id: z.string().uuid(),
  steps: z.array(stepSchema).max(50)
});

export interface ValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: string[];
  mitigations: string[];
}

export function validateWorkflow(workflow: any): ValidationResult {
  const violations: string[] = [];
  const mitigations: string[] = [];

  // Gate 1: Schema validation
  const parseResult = workflowSchema.safeParse(workflow);
  if (!parseResult.success) {
    violations.push(`Schema violation: ${parseResult.error.message}`);
    return {
      isValid: false,
      riskLevel: 'high',
      violations,
      mitigations: ['Fix workflow schema format']
    };
  }

  // Gate 2: Forbidden actions
  const forbiddenActions = ['eval', 'execute_script', 'innerHTML', 'download', 'file_upload'];
  const forbiddenUrls = ['localhost', '127.0.0.1', '0.0.0.0', 'file://'];
  
  for (const step of workflow.steps || []) {
    if (forbiddenActions.includes(step.action)) {
      violations.push(`Forbidden action detected: ${step.action}`);
      mitigations.push(`Remove action '${step.action}' immediately`);
    }
    
    if (step.target_url && forbiddenUrls.some(u => step.target_url.includes(u))) {
      violations.push(`Forbidden URL detected: ${step.target_url}`);
      mitigations.push('Use public URLs only');
    }
  }

  // Gate 3: Extraction limits
  const extractCount = (workflow.steps || []).filter((s: any) => s.action === 'extract').length;
  if (extractCount > 20) {
    violations.push(`Excessive data extraction: ${extractCount} extract steps`);
    mitigations.push('Use official APIs for bulk data operations');
  }

  // Risk level
  let riskLevel: ValidationResult['riskLevel'] = 'low';
  if (violations.length > 0) {
    if (violations.some(v => v.includes('Forbidden action') || v.includes('Forbidden URL'))) {
      riskLevel = 'critical';
    } else if (violations.length > 3) {
      riskLevel = 'high';
    } else {
      riskLevel = 'medium';
    }
  }

  return {
    isValid: riskLevel !== 'critical' && violations.length === 0,
    riskLevel,
    violations,
    mitigations
  };
}
