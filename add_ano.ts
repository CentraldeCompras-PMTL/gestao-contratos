import pg from "pg";
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE fontes_recurso ADD COLUMN IF NOT EXISTS ano varchar DEFAULT '2024'`);
    await client.query(`ALTER TABLE fontes_recurso ALTER COLUMN ano SET NOT NULL`);

    await client.query(`ALTER TABLE fichas_orcamentarias ADD COLUMN IF NOT EXISTS ano varchar DEFAULT '2024'`);
    await client.query(`ALTER TABLE fichas_orcamentarias ALTER COLUMN ano SET NOT NULL`);

    await client.query(`ALTER TABLE projetos_atividade ADD COLUMN IF NOT EXISTS ano varchar DEFAULT '2024'`);
    await client.query(`ALTER TABLE projetos_atividade ALTER COLUMN ano SET NOT NULL`);

    console.log("Columns added successfully");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
