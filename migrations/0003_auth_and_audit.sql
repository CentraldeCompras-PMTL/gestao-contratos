alter table "users"
  add column if not exists "force_password_change" boolean not null default false;

create table if not exists "password_reset_tokens" (
  "id" varchar primary key default gen_random_uuid(),
  "user_id" varchar not null references "users"("id") on delete cascade,
  "token_hash" text not null unique,
  "expires_at" timestamp not null,
  "used_at" timestamp,
  "created_at" timestamp default now()
);

create index if not exists "idx_password_reset_tokens_user_id"
  on "password_reset_tokens" ("user_id");

create table if not exists "audit_logs" (
  "id" varchar primary key default gen_random_uuid(),
  "user_id" varchar references "users"("id") on delete set null,
  "action" text not null,
  "entity" text not null,
  "entity_id" text,
  "details" text,
  "created_at" timestamp default now()
);

create index if not exists "idx_audit_logs_user_id"
  on "audit_logs" ("user_id");
