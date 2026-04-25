export interface WorkflowStep {
  step_id: number;
  action: 'navigate' | 'click' | 'type' | 'extract' | 'press' | 'wait' | 'scroll' | 'hover';
  description?: string;
  target?: {
    strategy: string;
    value: string;
    match_type?: string;
    timeout_ms?: number;
    retry_count?: number;
  };
  input_value?: string;
  target_url?: string;
  target_key?: string;
  variable_name?: string;
  stealth?: {
    humanize?: boolean;
    bezier_curves?: boolean;
    typing_speed_wpm?: number;
  };
  audit?: {
    screenshot_before?: boolean;
    screenshot_after?: boolean;
  };
}

export interface Workflow {
  id: string;
  workflow_title: string;
  start_url: string;
  session_id: string;
  status: 'draft' | 'active' | 'archived' | 'failed';
  steps: WorkflowStep[];
  metadata?: {
    frames_analyzed: number;
    tokens_used: number;
    cost_usd: number;
  };
  createdAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: string[];
  mitigations: string[];
}

export interface ExecutionStatus {
  executionId: string;
  status: 'pending' | 'running' | 'success' | 'partial' | 'failure';
  currentStep?: number;
  totalSteps: number;
  screenshots: { before?: string; after?: string }[];
  errorLog?: string[];
}

export interface AuditLog {
  timestamp: string;
  event_type: string;
  action: string;
  status: string;
  severity: string;
  step_id?: number;
  details?: Record<string, any>;
}

export interface KpiMetrics {
  success_rate: number;
  avg_processing_time_ms: number;
  error_rate: number;
  sla_compliance: 'PASS' | 'FAIL';
}
