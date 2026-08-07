const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = "postgresql://postgres:33ff81fe77ddc723ca57439b0d7c5054@xipxmg4q.us-west.database.insforge.app:5432/insforge?sslmode=require";
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
