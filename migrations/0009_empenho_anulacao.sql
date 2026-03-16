alter table public.empenhos
  add column if not exists status text not null default 'ativo',
  add column if not exists valor_anulado numeric(12, 2) not null default 0,
  add column if not exists data_anulacao date,
  add column if not exists motivo_anulacao text;

update public.empenhos
set
  status = coalesce(status, 'ativo'),
  valor_anulado = coalesce(valor_anulado, 0)
where status is null
   or valor_anulado is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'empenhos_status_chk'
  ) then
    alter table public.empenhos
      drop constraint empenhos_status_chk;
  end if;
end $$;

alter table public.empenhos
  add constraint empenhos_status_chk
  check (status in ('ativo', 'anulado_parcial', 'anulado'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'empenhos_valor_anulado_chk'
  ) then
    alter table public.empenhos
      drop constraint empenhos_valor_anulado_chk;
  end if;
end $$;

alter table public.empenhos
  add constraint empenhos_valor_anulado_chk
  check (valor_anulado >= 0 and valor_anulado <= valor_empenho);
