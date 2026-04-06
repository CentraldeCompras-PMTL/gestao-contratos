import pg from "pg";
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const res1 = await client.query(`SELECT count(*) FROM fontes_recurso`);
    const res2 = await client.query(`SELECT count(*) FROM fichas_orcamentarias`);
    const res3 = await client.query(`SELECT count(*) FROM projetos_atividade`);
    console.log("fontes_recurso:", res1.rows[0].count);
    console.log("fichas_orcamentarias:", res2.rows[0].count);
    console.log("projetos_atividade:", res3.rows[0].count);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
