export interface Point {
  x: number;
  y: number;
}

export interface Target {
  strategy: 'text_content' | 'css_selector' | 'xpath' | 'role' | 'placeholder' | 'test_id' | 'aria_label';
  value: string;
  match_type?: 'exact' | 'contains' | 'starts_with' | 'regex';
  frame_index?: number;
  timeout_ms?: number;
  retry_count?: number;
}

export interface StealthConfig {
  humanize?: boolean;
  bezier_curves?: boolean;
  typing_speed_wpm?: number;
  thinking_pause_ms?: number;
  mouse_overshoot?: boolean;
}

export interface AuditConfig {
  screenshot_before?: boolean;
  screenshot_after?: boolean;
  log_level?: 'debug' | 'info' | 'warn' | 'error';
  capture_dom?: boolean;
}

export interface ErrorHandling {
  on_failure: 'abort' | 'skip' | 'retry' | 'fallback';
  fallback_step_id?: number | null;
  max_retries?: number;
}

export interface WorkflowStep {
  step_id: number;
  action: 'navigate' | 'click' | 'type' | 'extract' | 'press' | 'wait' | 'scroll' | 'hover';
  description?: string;
  target?: Target;
  input_value?: string;
  target_url?: string;
  target_key?: string;
  variable_name?: string;
  stealth?: StealthConfig;
  audit?: AuditConfig;
  error_handling?: ErrorHandling;
}

export interface Workflow {
  workflow_title: string;
  start_url: string;
  session_id: string;
  workflow_id: string;
  created_at: string;
  steps: WorkflowStep[];
}
