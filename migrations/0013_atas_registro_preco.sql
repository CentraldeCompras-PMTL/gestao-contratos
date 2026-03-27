create table if not exists public.atas_registro_preco (
  id varchar primary key default gen_random_uuid(),
  processo_digital_id varchar not null references public.processos_digitais(id) on delete restrict,
  numero_ata text not null unique,
  objeto text not null,
  vigencia_inicial date not null,
  vigencia_final date not null,
  status text not null default 'planejamento',
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint atas_registro_preco_status_chk check (status in ('planejamento', 'cotacao', 'licitada', 'vigente', 'encerrada')),
  constraint atas_registro_preco_vigencia_chk check (vigencia_final >= vigencia_inicial)
);

create table if not exists public.ata_participantes (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references public.atas_registro_preco(id) on delete cascade,
  ente_id varchar not null references public.entes(id) on delete restrict,
  criado_em timestamp default now()
);

create table if not exists public.ata_itens (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references public.atas_registro_preco(id) on delete cascade,
  codigo_interno text not null,
  descricao text not null,
  unidade_medida text not null,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

create table if not exists public.ata_item_quantidades (
  id varchar primary key default gen_random_uuid(),
  item_id varchar not null references public.ata_itens(id) on delete cascade,
  ente_id varchar not null references public.entes(id) on delete restrict,
  quantidade numeric(14, 2) not null default 0,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_item_quantidades_quantidade_chk check (quantidade >= 0)
);

create table if not exists public.ata_item_cotacoes (
  id varchar primary key default gen_random_uuid(),
  item_id varchar not null unique references public.ata_itens(id) on delete cascade,
  valor_unitario_cotado numeric(14, 2) not null,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_item_cotacoes_valor_chk check (valor_unitario_cotado >= 0)
);

create table if not exists public.ata_item_resultados (
  id varchar primary key default gen_random_uuid(),
  item_id varchar not null unique references public.ata_itens(id) on delete cascade,
  valor_unitario_licitado numeric(14, 2),
  item_fracassado boolean not null default false,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_item_resultados_valor_chk check (valor_unitario_licitado is null or valor_unitario_licitado >= 0)
);

create unique index if not exists idx_ata_participantes_unique
  on public.ata_participantes (ata_id, ente_id);

create unique index if not exists idx_ata_itens_unique
  on public.ata_itens (ata_id, codigo_interno);

create unique index if not exists idx_ata_item_quantidades_unique
  on public.ata_item_quantidades (item_id, ente_id);

create index if not exists idx_atas_registro_preco_processo_digital_id
  on public.atas_registro_preco (processo_digital_id);

create index if not exists idx_ata_participantes_ata_id
  on public.ata_participantes (ata_id);

create index if not exists idx_ata_participantes_ente_id
  on public.ata_participantes (ente_id);

create index if not exists idx_ata_itens_ata_id
  on public.ata_itens (ata_id);

create index if not exists idx_ata_item_quantidades_item_id
  on public.ata_item_quantidades (item_id);

create index if not exists idx_ata_item_quantidades_ente_id
  on public.ata_item_quantidades (ente_id);

drop trigger if exists trg_atas_registro_preco_updated_at on public.atas_registro_preco;
create trigger trg_atas_registro_preco_updated_at
before update on public.atas_registro_preco
for each row
execute function public.set_updated_at();

drop trigger if exists trg_ata_itens_updated_at on public.ata_itens;
create trigger trg_ata_itens_updated_at
before update on public.ata_itens
for each row
execute function public.set_updated_at();

drop trigger if exists trg_ata_item_quantidades_updated_at on public.ata_item_quantidades;
create trigger trg_ata_item_quantidades_updated_at
before update on public.ata_item_quantidades
for each row
execute function public.set_updated_at();

drop trigger if exists trg_ata_item_cotacoes_updated_at on public.ata_item_cotacoes;
create trigger trg_ata_item_cotacoes_updated_at
before update on public.ata_item_cotacoes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_ata_item_resultados_updated_at on public.ata_item_resultados;
create trigger trg_ata_item_resultados_updated_at
before update on public.ata_item_resultados
for each row
execute function public.set_updated_at();
