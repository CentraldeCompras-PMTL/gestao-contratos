const { Pool } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
for (const line of envFile.split('\n')) {
  if (line.includes('=')) {
    const [k, ...v] = line.trim().split('=');
    process.env[k] = v.join('=').replace(/^"|"$/g, '');
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "processo_participantes" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "processo_id" varchar NOT NULL REFERENCES "processos_digitais"("id"),
        "departamento_id" varchar NOT NULL REFERENCES "departamentos"("id"),
        "criado_em" timestamp DEFAULT now(),
        CONSTRAINT "idx_processo_participantes_unique" UNIQUE("processo_id", "departamento_id")
      );
    `);
    console.log('Created processo_participantes table');
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
