import promClient from 'prom-client';

export const register = new promClient.Registry();

promClient.collectDefaultMetrics({
  register,
  prefix: 'autopilot_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

export const httpRequestDuration = new promClient.Histogram({
  name: 'autopilot_http_request_duration_seconds',
  help: 'مدة طلبات HTTP بالثواني',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestsTotal = new promClient.Counter({
  name: 'autopilot_http_requests_total',
  help: 'إجمالي عدد طلبات HTTP',
  labelNames: ['method', 'route', 'status_code'],
});

export const workflowExecutionsTotal = new promClient.Counter({
  name: 'autopilot_workflow_executions_total',
  help: 'إجمالي عدد تنفيذات الـ Workflows',
  labelNames: ['status', 'workflow_id'],
});

export const workflowExecutionDuration = new promClient.Histogram({
  name: 'autopilot_workflow_execution_duration_seconds',
  help: 'مدة تنفيذ الـ Workflow بالثواني',
  labelNames: ['workflow_id'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

export const activeExecutions = new promClient.Gauge({
  name: 'autopilot_active_executions',
  help: 'عدد التنفيذات النشطة حالياً',
});

export const visionAnalysisDuration = new promClient.Histogram({
  name: 'autopilot_vision_analysis_duration_seconds',
  help: 'مدة تحليل الفيديو بالثواني',
  labelNames: ['vlm_provider'],
  buckets: [5, 15, 30, 60, 90, 120, 180],
});

export const visionCostUsd = new promClient.Counter({
  name: 'autopilot_vision_cost_usd_total',
  help: 'التكلفة الإجمالية لتحليل الفيديو بالدولار',
  labelNames: ['vlm_provider'],
});

export const sentinelAlertsTotal = new promClient.Counter({
  name: 'autopilot_sentinel_alerts_total',
  help: 'إجمالي عدد التنبيهات الأمنية',
  labelNames: ['rule_name', 'severity'],
});

export const auditLogEntriesTotal = new promClient.Counter({
  name: 'autopilot_audit_log_entries_total',
  help: 'إجمالي عدد سجلات التدقيق',
  labelNames: ['event_type', 'status'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(workflowExecutionsTotal);
register.registerMetric(workflowExecutionDuration);
register.registerMetric(activeExecutions);
register.registerMetric(visionAnalysisDuration);
register.registerMetric(visionCostUsd);
register.registerMetric(sentinelAlertsTotal);
register.registerMetric(auditLogEntriesTotal);

export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestsTotal.inc(
      { method: req.method, route, status_code: res.statusCode }
    );
  });
  
  next();
}

export async function metricsEndpoint(req: any, res: any) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
