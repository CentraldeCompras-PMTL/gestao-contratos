alter table public.ata_empenhos
  add column if not exists quantidade_empenhada numeric(14, 2);

update public.ata_empenhos e
set quantidade_empenhada = p.quantidade_solicitada
from public.ata_pre_pedidos p
where p.id = e.ata_pre_pedido_id
  and e.quantidade_empenhada is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'ata_empenhos_quantidade_chk'
  ) then
    alter table public.ata_empenhos
      drop constraint ata_empenhos_quantidade_chk;
  end if;
end $$;

alter table public.ata_empenhos
  alter column quantidade_empenhada set default 0;

alter table public.ata_empenhos
  alter column quantidade_empenhada set not null;

alter table public.ata_empenhos
  add constraint ata_empenhos_quantidade_chk
  check (quantidade_empenhada > 0);

drop index if exists public.idx_ata_empenhos_unique_pre_pedido;

create index if not exists idx_ata_empenhos_pre_pedido_id
  on public.ata_empenhos (ata_pre_pedido_id);
