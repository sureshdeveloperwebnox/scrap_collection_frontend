const { spawn } = require('child_process');

console.log('Starting Next.js development server...');

const nextDev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

nextDev.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
});

nextDev.on('error', (error) => {
  console.error('Failed to start Next.js:', error);
});

// Keep the process running
setTimeout(() => {
  console.log('Server should be running on http://localhost:3000');
}, 5000);