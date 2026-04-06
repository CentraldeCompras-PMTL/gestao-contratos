import pg from "pg";
import fs from "fs";
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('fontes_recurso', 'fichas_orcamentarias', 'projetos_atividade')
      ORDER BY table_name, column_name
    `);
    fs.writeFileSync("columns_out.json", JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
