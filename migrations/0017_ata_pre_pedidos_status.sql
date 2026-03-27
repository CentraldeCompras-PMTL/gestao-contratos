update public.ata_pre_pedidos
set status = 'concluido'
where status in ('empenhado', 'cancelado');

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'ata_pre_pedidos_status_chk'
  ) then
    alter table public.ata_pre_pedidos
      drop constraint ata_pre_pedidos_status_chk;
  end if;
end $$;

alter table public.ata_pre_pedidos
  add constraint ata_pre_pedidos_status_chk
  check (status in ('aberto', 'concluido'));
