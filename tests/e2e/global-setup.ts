import { execSync } from 'child_process';

async function globalSetup() {
  console.log('🚀 Starting Process Autopilot stack for E2E tests...');
  
  try {
    execSync('docker-compose ps | grep "autopilot-frontend"', { stdio: 'pipe' });
    console.log('⚠️  Stack already running, skipping startup');
    return;
  } catch {
  }
  
  execSync('docker-compose -f ../../docker-compose.yml up -d', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('⏳ Waiting for services to be healthy...');
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const health = execSync('curl -s http://localhost:3000/health', { encoding: 'utf-8' });
      if (health.includes('healthy')) {
        console.log('✅ All services are healthy');
        break;
      }
    } catch {
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('🎉 E2E environment ready');
}

export default globalSetup;
