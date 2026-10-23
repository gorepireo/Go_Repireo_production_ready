const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = process.env.LEGACY_DATABASE_URL;
  if (!connectionString) throw new Error('LEGACY_DATABASE_URL is required.');
  const client = new Client({ connectionString });
  await client.connect();
  const sql = fs.readFileSync('C:/Users/mandi/.gemini/antigravity/brain/064c5695-6b89-4553-81c7-b20742b49874/scratch/fix_77_issues.sql', 'utf8');
  try {
    await client.query(sql);
    console.log("SQL executed successfully.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}
run();
