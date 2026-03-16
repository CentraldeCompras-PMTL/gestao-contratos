alter table "contratos"
  add column if not exists "status" text not null default 'vigente',
  add column if not exists "encerrado_em" date,
  add column if not exists "motivo_encerramento" text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contratos_status_chk'
  ) then
    alter table "contratos"
      add constraint "contratos_status_chk"
      check ("status" in ('vigente', 'encerrado'));
  end if;
end $$;
