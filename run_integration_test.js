const { spawn } = require('child_process');
const path = require('path');

async function run() {
  console.log('Starting backend...');
  const backend = spawn('node', ['backend/server.js'], {
    env: { ...process.env, PORT: '5003' },
    stdio: 'inherit'
  });

  console.log('Starting frontend...');
  // Need to use the vite binary
  const vitePath = path.resolve(__dirname, 'frontend', 'node_modules', '.bin', 'vite');
  const frontend = spawn(vitePath, ['--port', '5173', '--host', '0.0.0.0', 'frontend'], {
    env: { ...process.env, VITE_BACKEND_URL: 'http://localhost:5003' },
    stdio: 'inherit'
  });

  // Wait for servers
  console.log('Waiting 15 seconds for servers to initialize...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log('Starting Playwright test...');
  const test = spawn('node', ['frontend/tests/integration_playwright.cjs'], {
    stdio: 'inherit'
  });

  test.on('exit', (code) => {
    console.log(`Test exited with code ${code}`);
    backend.kill();
    frontend.kill();
    process.exit(code);
  });
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
