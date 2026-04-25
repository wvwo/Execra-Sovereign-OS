import axios from 'axios';

const SENTINEL_URL = process.env.SENTINEL_URL || 'http://sentinel:8001';
const SENTINEL_KEY = process.env.SENTINEL_API_KEY;
if (!SENTINEL_KEY) {
  console.warn('[Sentinel] SENTINEL_API_KEY not set — audit log forwarding disabled');
}

export async function queryAuditLogs(params: any) {
  const response = await axios.get(`${SENTINEL_URL}/api/v1/audit/query`, {
    params,
    headers: { Authorization: `Bearer ${SENTINEL_KEY}` }
  });
  return response.data;
}

export async function getQualityMetrics(workflowId: string, sessionId: string) {
  const response = await axios.get(
    `${SENTINEL_URL}/api/v1/quality/metrics/${workflowId}/${sessionId}`,
    { headers: { Authorization: `Bearer ${SENTINEL_KEY}` } }
  );
  return response.data;
}
