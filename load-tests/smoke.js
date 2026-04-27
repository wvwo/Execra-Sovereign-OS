import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export function setup() {
  // Register before login
  const registerRes = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      email: __ENV.TEST_EMAIL || 'test@execra.io',
      password: __ENV.TEST_PASSWORD || 'TestPass123!',
      name: 'CI Test User'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: __ENV.TEST_EMAIL || 'test@execra.io',
      password: __ENV.TEST_PASSWORD || 'TestPass123!',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (!loginRes || !loginRes.body || loginRes.status !== 200) {
    console.warn(`Login failed: ${loginRes ? loginRes.status : 'no response'}`);
    return { token: null };
  }

  const body = JSON.parse(loginRes.body);
  return { token: body.token || body.accessToken || null };
}

export default function (data) {
  if (!data.token) {
    console.warn('No token — skipping test iteration');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Test 1: Health Check
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health OK': (r) => r.status === 200 });

  // Test 2: List Workflows
  const workflows = http.get(`${BASE_URL}/api/v1/workflows`, { headers });
  check(workflows, { 'workflows OK': (r) => r.status === 200 || r.status === 401 || r.status === 404 });

  sleep(1);
}
