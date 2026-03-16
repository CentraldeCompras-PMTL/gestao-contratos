create table if not exists "entes" (
  "id" varchar primary key default gen_random_uuid(),
  "nome" text not null unique,
  "sigla" text not null unique,
  "criado_em" timestamp default now(),
  "atualizado_em" timestamp default now()
);

alter table "users"
  add column if not exists "ente_id" varchar;

alter table "departamentos"
  add column if not exists "ente_id" varchar references "entes"("id") on delete set null;

create index if not exists "idx_departamentos_ente_id"
  on "departamentos" ("ente_id");
