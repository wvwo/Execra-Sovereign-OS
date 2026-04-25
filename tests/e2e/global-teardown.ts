import { execSync } from 'child_process';

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E environment...');
  
  if (process.env.DEBUG_MODE) {
    console.log('🔧 Debug mode: keeping stack running');
    return;
  }
  
  execSync('docker-compose -f ../../docker-compose.yml down -v', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('✅ Cleanup complete');
}

export default globalTeardown;
