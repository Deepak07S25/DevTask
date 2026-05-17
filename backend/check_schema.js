const { Pool } = require('pg');
require('dotenv').config();

const directUrl = process.env.DATABASE_URL.replace('-pooler', '');

const pool = new Pool({
  connectionString: directUrl,
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Task';
    `);
    
    const cols = res.rows.map(r => r.column_name);
    
    const requiredCols = [
      'estimatePoints', 
      'actualPoints', 
      'blocked', 
      'riskScore', 
      'riskLevel', 
      'riskReasons'
    ];

    console.log("Checking Task columns:");
    for (const c of requiredCols) {
      console.log(`- ${c}: ${cols.includes(c) ? 'Exists' : 'Missing'}`);
    }

    const typeRes = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'TaskRiskLevel';
    `);

    console.log(`\nEnum TaskRiskLevel: ${typeRes.rows.length > 0 ? 'Exists' : 'Missing'}`);

  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    pool.end();
  }
}

main();
