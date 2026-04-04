import { db } from "./server/db.ts";
import { sql } from "drizzle-orm";

async function runMigrate() {
  console.log("Migrating processo_dotacoes...");
  try {
    await db.execute(sql\`
      CREATE TABLE IF NOT EXISTS "processo_dotacoes" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "processo_id" varchar NOT NULL,
        "ficha_orcamentaria_id" varchar NOT NULL,
        "ano_dotacao" varchar NOT NULL,
        "valor_estimado" numeric(14, 2),
        "criado_em" timestamp DEFAULT now(),
        "atualizado_em" timestamp DEFAULT now()
      );
    \`);
    await db.execute(sql\`
      DO $$ BEGIN
        ALTER TABLE "processo_dotacoes" ADD CONSTRAINT "processo_dotacoes_processo_id_processos_digitais_id_fk" FOREIGN KEY ("processo_id") REFERENCES "processos_digitais"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    \`);
    await db.execute(sql\`
      DO $$ BEGIN
        ALTER TABLE "processo_dotacoes" ADD CONSTRAINT "processo_dotacoes_ficha_orcamentaria_id_fichas_orcamentarias_id_fk" FOREIGN KEY ("ficha_orcamentaria_id") REFERENCES "fichas_orcamentarias"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    \`);
    console.log("Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed", err);
    process.exit(1);
  }
}

runMigrate();
