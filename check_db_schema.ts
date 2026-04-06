import pg from "pg";
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("Checking columns for 'contratos' table:");
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contratos'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    
    console.log("Checking columns for 'processos_digitais' table:");
    const res2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'processos_digitais'
    `);
    console.log(JSON.stringify(res2.rows, null, 2));
    
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
