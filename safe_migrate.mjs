import pg from "pg";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
const connectionString = dbUrlMatch ? dbUrlMatch[1].trim() : process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

const { Pool } = pg;
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
      ALTER TABLE "processo_dotacoes"
        ADD CONSTRAINT "proc_dot_proc_fk"
        FOREIGN KEY ("processo_id") REFERENCES "processos_digitais"("id");
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE "processo_dotacoes"
        ADD CONSTRAINT "proc_dot_ficha_fk"
        FOREIGN KEY ("ficha_orcamentaria_id") REFERENCES "fichas_orcamentarias"("id");
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  console.log("✅ Migration complete!");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
} finally {
  await pool.end();
}
