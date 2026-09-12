const { execSync } = require('child_process');

try {
  if (process.env.OPENNEXT_IS_BUILDING === '1') {
    console.log('OpenNext is building: running native next build...');
    execSync('npx next build', { stdio: 'inherit' });
  } else {
    console.log('Starting OpenNext build...');
    execSync('npx @opennextjs/cloudflare@latest build', { 
      stdio: 'inherit',
      env: { ...process.env, OPENNEXT_IS_BUILDING: '1' }
    });
  }
} catch (error) {
  console.error('Build failed');
  process.exit(error.status || 1);
}
