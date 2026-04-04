require("dotenv").config();
const { Pool } = require("pg");

async function runMigrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  
  console.log("Migrating processo_dotacoes...");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "processo_dotacoes" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "processo_id" varchar NOT NULL,
        "ficha_orcamentaria_id" varchar NOT NULL,
        "ano_dotacao" varchar NOT NULL,
        "valor_estimado" numeric(14, 2),
        "criado_em" timestamp DEFAULT now(),
        "atualizado_em" timestamp DEFAULT now()
      );
    `);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "processo_dotacoes" ADD CONSTRAINT "processo_dotacoes_processo_id_processos_digitais_id_fk" FOREIGN KEY ("processo_id") REFERENCES "processos_digitais"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "processo_dotacoes" ADD CONSTRAINT "processo_dotacoes_ficha_orcamentaria_id_fichas_orcamentarias_id_fk" FOREIGN KEY ("ficha_orcamentaria_id") REFERENCES "fichas_orcamentarias"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    await pool.end();
  }
}

runMigrate();
