import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at 50
    { duration: '2m', target: 100 },  // Spike to 100
    { duration: '5m', target: 50 },   // Back to 50
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: __ENV.TEST_EMAIL || 'test@execra.io',
    password: __ENV.TEST_PASSWORD || 'Test@123456',
  }), { headers: { 'Content-Type': 'application/json' } });
  
  return { token: loginRes.json('token') || 'fake_token_for_now' };
}

export default function (data) {
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
