const { spawn } = require('child_process');

const cmd = process.platform.startsWith('win') ? 'npx.cmd' : 'npx';
const p = spawn(cmd, ['drizzle-kit', 'push', '--force'], { stdio: ['pipe', 'pipe', 'pipe'], shell: true });

p.stdout.on('data', d => {
  const line = d.toString();
  process.stdout.write(line);
  if (line.includes('rename table') || line.includes('truncate the table') || line.includes('Are you sure')) {
    p.stdin.write('\n');
  }
});

p.stderr.on('data', d => {
  const line = d.toString();
  process.stderr.write(line);
  if (line.includes('rename table') || line.includes('truncate the table') || line.includes('Are you sure')) {
    p.stdin.write('\n');
  }
});

p.on('close', code => {
  console.log(`Drizzle push exited with code ${code}`);
  process.exit(code);
});
