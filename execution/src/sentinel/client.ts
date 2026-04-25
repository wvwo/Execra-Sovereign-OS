import axios from 'axios';

export interface AuditLogPayload {
  session_id: string;
  workflow_id?: string;
  step_id?: number;
  event_type: string;
  action: string;
  status: 'success' | 'failure' | 'retry' | 'skipped';
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  details?: Record<string, any>;
  screenshot_path?: string;
  processing_time_ms?: number;
  retry_count?: number;
  user_id?: string;
  source_ip?: string;
}

export class SentinelClient {
  public url: string;
  private apiKey: string;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  async log(payload: AuditLogPayload): Promise<boolean> {
    try {
      if (!payload.user_id) payload.user_id = 'system';
      if (!payload.source_ip) payload.source_ip = '127.0.0.1';
      if (!payload.severity) payload.severity = 'info';

      await axios.post(`${this.url}/api/v1/audit/log`, payload, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 5000
      });
      return true;
    } catch (err) {
      console.warn('Sentinel log failed:', (err as Error).message);
      return false;
    }
  }

  async notifyStepUpdate(executionId: string, stepData: any): Promise<void> {
    try {
      await axios.post(`${this.url}/internal/ws/emit`, {
        executionId,
        event: 'step_update',
        data: stepData
      }, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 3000
      });
    } catch (err) {
      console.warn('WS notification failed:', (err as Error).message);
    }
  }
}
