export type ActionType =
  | 'click' | 'type' | 'extract' | 'navigate'
  | 'press' | 'wait' | 'scroll' | 'screenshot'
  | 'condition' | 'loop' | 'api_call' | 'transform'
  | 'hover' | 'webhook';

export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export type TargetStrategy =
  | 'text' | 'placeholder' | 'text_relative' | 'aria'
  | 'xpath' | 'css' | 'text_content' | 'role' | 'test_id' | 'aria_label';

export interface ConditionBlock {
  if_variable: string;
  operator: 'equals' | 'contains' | 'exists' | 'not_exists';
  value: string;
  then_step_id: number;
  else_step_id?: number;
}

export interface LoopBlock {
  source_variable: string;
  item_variable: string;
  max_iterations: number;
}

export interface APICallBlock {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body_template?: string;
  response_variable: string;
}

export interface WorkflowStep {
  step_id: number;
  action: ActionType;
  target_type?: TargetStrategy;
  target_value?: string;
  reference_text?: string;
  variable_name?: string;
  input_value?: string;
  target_key?: string;
  target_url?: string;
  description: string;
  timeout_ms?: number;
  retry_count?: number;
  on_failure?: 'stop' | 'continue' | 'retry';
  condition?: ConditionBlock;
  loop?: LoopBlock;
  api_call?: APICallBlock;
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

export interface ScheduleConfig {
  enabled: boolean;
  cron: string;
  timezone: string;
  next_run?: string;
}

export interface Workflow {
  id: string;
  workflow_title: string;
  title: string;
  description?: string;
  start_url: string;
  startUrl: string;
  steps: WorkflowStep[];
  variables: Record<string, string>;
  tags: string[];
  isTemplate: boolean;
  schedule?: ScheduleConfig;
  runCount: number;
  successRate: number;
  avgDurationMs: number;
  thumbnail?: string;
  status: 'draft' | 'active' | 'archived' | 'failed';
  metadata?: {
    frames_analyzed: number;
    tokens_used: number;
    cost_usd: number;
  };
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLogEntry {
  timestamp: string;
  level: 'info' | 'action' | 'success' | 'error' | 'warn';
  message: string;
  step_id?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'pending' | 'partial';
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  stepsCompleted: number;
  stepsTotal: number;
  error?: string;
  extractedVariables?: Record<string, string>;
  log?: ExecutionLogEntry[];
  screenshots?: string[];
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'Data Transfer' | 'Scraping' | 'Monitoring' | 'Forms' | 'Communication' | 'Reporting';
  icon: string;
  workflow: Partial<Workflow>;
  useCount: number;
  isOfficial: boolean;
  createdAt: string;
}

export interface GlobalVariable {
  id: string;
  name: string;
  value: string;
  isSecret: boolean;
  description?: string;
  environment: 'all' | 'dev' | 'staging' | 'prod';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'milestone' | 'schedule';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AnalyticsData {
  totalRuns: number;
  totalRunsPrev: number;
  successRate: number;
  hoursSaved: number;
  activeWorkflows: number;
  recordsProcessed: number;
  dailyRuns: { date: string; runs: number; success: number; failed: number }[];
  topWorkflows: { id: string; title: string; runCount: number; successRate: number }[];
  stepFailures: { step_action: string; failures: number }[];
}
