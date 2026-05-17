const { execSync } = require('child_process');
require('dotenv').config();

// Create the direct URL by removing '-pooler' from the host to avoid advisory lock timeouts
const directUrl = process.env.DATABASE_URL.replace('-pooler', '');

try {
  console.log('Resolving migration: 20260517000000_ai_agent_risk ...');
  execSync('npx prisma migrate resolve --applied 20260517000000_ai_agent_risk', {
    env: { ...process.env, DATABASE_URL: directUrl },
    stdio: 'inherit'
  });
  
  console.log('\nChecking migration status...');
  execSync('npx prisma migrate status', {
    env: { ...process.env, DATABASE_URL: directUrl },
    stdio: 'inherit'
  });
} catch (err) {
  console.error('Error running commands.');
}
