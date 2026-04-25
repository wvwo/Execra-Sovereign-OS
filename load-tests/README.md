# Execra Load Tests

## Installation
brew install k6

## Run Tests
# Smoke test (quick validation)
k6 run load-tests/smoke.js

# Stress test (full load)
k6 run load-tests/stress.js

# With custom URL
BASE_URL=https://api.yourdomain.com k6 run load-tests/smoke.js

## Expected Thresholds
- p95 < 500ms (smoke)
- p95 < 1000ms (stress)
- Error rate < 1% (smoke)
- Error rate < 5% (stress)
