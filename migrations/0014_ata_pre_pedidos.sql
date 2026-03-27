create table if not exists public.ata_pre_pedidos (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references public.atas_registro_preco(id) on delete cascade,
  item_id varchar not null references public.ata_itens(id) on delete restrict,
  ente_id varchar not null references public.entes(id) on delete restrict,
  fonte_recurso_id varchar not null references public.fontes_recurso(id) on delete restrict,
  ficha_id varchar not null references public.fichas_orcamentarias(id) on delete restrict,
  quantidade_solicitada numeric(14, 2) not null,
  status text not null default 'aberto',
  observacao text,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_pre_pedidos_quantidade_chk check (quantidade_solicitada > 0),
  constraint ata_pre_pedidos_status_chk check (status in ('aberto', 'empenhado', 'cancelado', 'concluido'))
);

create index if not exists idx_ata_pre_pedidos_ata_id
  on public.ata_pre_pedidos (ata_id);

create index if not exists idx_ata_pre_pedidos_item_id
  on public.ata_pre_pedidos (item_id);

create index if not exists idx_ata_pre_pedidos_ente_id
  on public.ata_pre_pedidos (ente_id);

create index if not exists idx_ata_pre_pedidos_fonte_recurso_id
  on public.ata_pre_pedidos (fonte_recurso_id);

create index if not exists idx_ata_pre_pedidos_ficha_id
  on public.ata_pre_pedidos (ficha_id);

drop trigger if exists trg_ata_pre_pedidos_updated_at on public.ata_pre_pedidos;
create trigger trg_ata_pre_pedidos_updated_at
before update on public.ata_pre_pedidos
for each row
execute function public.set_updated_at();
