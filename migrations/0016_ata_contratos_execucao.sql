create table if not exists public.ata_contratos (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references public.atas_registro_preco(id) on delete cascade,
  numero_contrato text not null unique,
  objeto text not null,
  vigencia_inicial date not null,
  vigencia_final date not null,
  status text not null default 'vigente',
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_contratos_status_chk check (status in ('vigente', 'encerrado')),
  constraint ata_contratos_vigencia_chk check (vigencia_final >= vigencia_inicial)
);

alter table public.ata_pre_pedidos
  add column if not exists ata_contrato_id varchar references public.ata_contratos(id) on delete set null;

create table if not exists public.ata_empenhos (
  id varchar primary key default gen_random_uuid(),
  ata_contrato_id varchar not null references public.ata_contratos(id) on delete cascade,
  ata_pre_pedido_id varchar not null references public.ata_pre_pedidos(id) on delete restrict,
  data_empenho date not null,
  numero_empenho text not null,
  quantidade_empenhada numeric(14, 2) not null,
  valor_empenho numeric(14, 2) not null,
  status text not null default 'ativo',
  criado_em timestamp default now(),
  constraint ata_empenhos_quantidade_chk check (quantidade_empenhada > 0),
  constraint ata_empenhos_valor_chk check (valor_empenho >= 0),
  constraint ata_empenhos_status_chk check (status in ('ativo'))
);

create table if not exists public.ata_afs (
  id varchar primary key default gen_random_uuid(),
  ata_empenho_id varchar not null references public.ata_empenhos(id) on delete cascade,
  data_pedido_af date not null,
  valor_af numeric(14, 2) not null,
  data_estimada_entrega date not null,
  data_entrega_real date,
  criado_em timestamp default now(),
  constraint ata_afs_valor_chk check (valor_af >= 0)
);

create index if not exists idx_ata_contratos_ata_id
  on public.ata_contratos (ata_id);

create index if not exists idx_ata_pre_pedidos_ata_contrato_id
  on public.ata_pre_pedidos (ata_contrato_id);

create index if not exists idx_ata_empenhos_contrato_id
  on public.ata_empenhos (ata_contrato_id);

create index if not exists idx_ata_empenhos_pre_pedido_id
  on public.ata_empenhos (ata_pre_pedido_id);

create index if not exists idx_ata_afs_empenho_id
  on public.ata_afs (ata_empenho_id);

drop trigger if exists trg_ata_contratos_updated_at on public.ata_contratos;
create trigger trg_ata_contratos_updated_at
before update on public.ata_contratos
for each row
execute function public.set_updated_at();
