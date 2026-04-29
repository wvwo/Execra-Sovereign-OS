// Re-export all types from the canonical workflow types file
export * from './workflow';

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
  details?: Record<string, unknown>;
}

export interface KpiMetrics {
  success_rate: number;
  avg_processing_time_ms: number;
  error_rate: number;
  sla_compliance: 'PASS' | 'FAIL';
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
