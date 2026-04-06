import pg from "pg";
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM contratos LIMIT 0");
    console.log("Contratos columns:", res.fields.map(f => f.name).join(", "));
    
    const res2 = await client.query("SELECT * FROM processos_digitais LIMIT 0");
    console.log("ProcessosDigitais columns:", res2.fields.map(f => f.name).join(", "));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
