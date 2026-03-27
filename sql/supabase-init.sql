create extension if not exists pgcrypto;

create table if not exists users (
  id varchar primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  name text,
  role text not null default 'operacional',
  ente_id varchar,
  can_access_ata_module boolean not null default false,
  force_password_change boolean not null default false,
  created_at timestamp default now()
);

create table if not exists entes (
  id varchar primary key default gen_random_uuid(),
  nome text not null unique,
  sigla text not null unique,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

create table if not exists user_entes (
  id varchar primary key default gen_random_uuid(),
  user_id varchar not null references users(id) on delete cascade,
  ente_id varchar not null references entes(id) on delete cascade,
  created_at timestamp default now()
);

create table if not exists password_reset_tokens (
  id varchar primary key default gen_random_uuid(),
  user_id varchar not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamp not null,
  used_at timestamp,
  created_at timestamp default now()
);

create table if not exists session (
  sid varchar not null collate "default" primary key,
  sess json not null,
  expire timestamp(6) not null
);

create table if not exists audit_logs (
  id varchar primary key default gen_random_uuid(),
  user_id varchar references users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details text,
  created_at timestamp default now()
);

create table if not exists departamentos (
  id varchar primary key default gen_random_uuid(),
  ente_id varchar references entes(id) on delete set null,
  nome text not null unique,
  descricao text,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

create table if not exists fornecedores (
  id varchar primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  email text,
  telefone text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  municipio text,
  uf text,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

create table if not exists fontes_recurso (
  id varchar primary key default gen_random_uuid(),
  nome text not null,
  codigo text not null unique,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

create table if not exists fichas_orcamentarias (
  id varchar primary key default gen_random_uuid(),
  fonte_recurso_id varchar not null references fontes_recurso(id) on delete restrict,
  codigo text not null,
  classificacao text not null,
  criado_em timestamp default now(),
  constraint fichas_classificacao_chk check (classificacao in ('consumo', 'servico', 'permanente'))
);

create table if not exists processos_digitais (
  id varchar primary key default gen_random_uuid(),
  numero_processo_digital text not null unique,
  objeto_completo text not null,
  objeto_resumido text not null,
  descricao text,
  departamento_id varchar references departamentos(id) on delete set null,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

create table if not exists fases_contratacao (
  id varchar primary key default gen_random_uuid(),
  processo_digital_id varchar not null references processos_digitais(id) on delete restrict,
  departamento_id varchar references departamentos(id) on delete set null,
  nome_fase text not null,
  fornecedor_id varchar not null references fornecedores(id) on delete restrict,
  modalidade text not null,
  numero_modalidade text not null,
  data_inicio date not null,
  data_fim date,
  criado_em timestamp default now(),
  constraint fases_contratacao_data_chk check (data_fim is null or data_fim >= data_inicio)
);

create table if not exists contratos (
  id varchar primary key default gen_random_uuid(),
  processo_digital_id varchar not null references processos_digitais(id) on delete restrict,
  fase_contratacao_id varchar not null references fases_contratacao(id) on delete restrict,
  departamento_id varchar references departamentos(id) on delete set null,
  numero_contrato text not null unique,
  fornecedor_id varchar not null references fornecedores(id) on delete restrict,
  valor_contrato numeric(12, 2) not null,
  vigencia_inicial date not null,
  vigencia_final date not null,
  status text not null default 'vigente',
  encerrado_em date,
  motivo_encerramento text,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint contratos_valor_chk check (valor_contrato >= 0),
  constraint contratos_vigencia_chk check (vigencia_final >= vigencia_inicial),
  constraint contratos_status_chk check (status in ('vigente', 'encerrado'))
);

create table if not exists atas_registro_preco (
  id varchar primary key default gen_random_uuid(),
  processo_digital_id varchar not null references processos_digitais(id) on delete restrict,
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

create table if not exists ata_participantes (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references atas_registro_preco(id) on delete cascade,
  ente_id varchar not null references entes(id) on delete restrict,
  criado_em timestamp default now()
);

create table if not exists ata_fornecedores (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references atas_registro_preco(id) on delete cascade,
  fornecedor_id varchar not null references fornecedores(id) on delete restrict,
  criado_em timestamp default now()
);

create table if not exists ata_itens (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references atas_registro_preco(id) on delete cascade,
  codigo_interno text not null,
  descricao text not null,
  unidade_medida text not null,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

create table if not exists ata_item_quantidades (
  id varchar primary key default gen_random_uuid(),
  item_id varchar not null references ata_itens(id) on delete cascade,
  ente_id varchar not null references entes(id) on delete restrict,
  quantidade numeric(14, 2) not null default 0,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_item_quantidades_quantidade_chk check (quantidade >= 0)
);

create table if not exists ata_item_cotacoes (
  id varchar primary key default gen_random_uuid(),
  item_id varchar not null unique references ata_itens(id) on delete cascade,
  valor_unitario_cotado numeric(14, 2) not null,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_item_cotacoes_valor_chk check (valor_unitario_cotado >= 0)
);

create table if not exists ata_item_resultados (
  id varchar primary key default gen_random_uuid(),
  item_id varchar not null unique references ata_itens(id) on delete cascade,
  fornecedor_id varchar references fornecedores(id) on delete set null,
  valor_unitario_licitado numeric(14, 2),
  item_fracassado boolean not null default false,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_item_resultados_valor_chk check (valor_unitario_licitado is null or valor_unitario_licitado >= 0)
);

create table if not exists ata_contratos (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references atas_registro_preco(id) on delete cascade,
  fornecedor_id varchar not null references fornecedores(id) on delete restrict,
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

create table if not exists ata_pre_pedidos (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references atas_registro_preco(id) on delete cascade,
  ata_contrato_id varchar references ata_contratos(id) on delete set null,
  item_id varchar not null references ata_itens(id) on delete restrict,
  ente_id varchar not null references entes(id) on delete restrict,
  fonte_recurso_id varchar not null references fontes_recurso(id) on delete restrict,
  ficha_id varchar not null references fichas_orcamentarias(id) on delete restrict,
  quantidade_solicitada numeric(14, 2) not null,
  status text not null default 'aberto',
  observacao text,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_pre_pedidos_quantidade_chk check (quantidade_solicitada > 0),
  constraint ata_pre_pedidos_status_chk check (status in ('aberto', 'concluido'))
);

create table if not exists ata_empenhos (
  id varchar primary key default gen_random_uuid(),
  ata_contrato_id varchar references ata_contratos(id) on delete cascade,
  ata_pre_pedido_id varchar not null references ata_pre_pedidos(id) on delete restrict,
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

create table if not exists ata_afs (
  id varchar primary key default gen_random_uuid(),
  ata_empenho_id varchar not null references ata_empenhos(id) on delete cascade,
  data_pedido_af date not null,
  quantidade_af numeric(14, 2) not null,
  valor_af numeric(14, 2) not null,
  data_estimada_entrega date not null,
  data_entrega_real date,
  criado_em timestamp default now(),
  constraint ata_afs_valor_chk check (valor_af >= 0)
);

create table if not exists ata_notas_fiscais (
  id varchar primary key default gen_random_uuid(),
  ata_contrato_id varchar references ata_contratos(id) on delete cascade,
  ata_af_id varchar not null references ata_afs(id) on delete cascade,
  numero_nota text not null,
  quantidade_nota numeric(14, 2) not null,
  valor_nota numeric(14, 2) not null,
  data_nota date not null,
  status_pagamento text not null default 'nota_recebida',
  numero_processo_pagamento text,
  data_envio_pagamento date,
  data_pagamento date,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint ata_notas_fiscais_valor_chk check (valor_nota >= 0),
  constraint ata_notas_fiscais_status_chk check (status_pagamento in ('nota_recebida', 'aguardando_pagamento', 'pago')),
  constraint ata_notas_fiscais_pagamento_chk check (data_pagamento is null or data_pagamento >= data_nota)
);

create table if not exists empenhos (
  id varchar primary key default gen_random_uuid(),
  contrato_id varchar not null references contratos(id) on delete restrict,
  fonte_recurso_id varchar not null references fontes_recurso(id) on delete restrict,
  ficha_id varchar not null references fichas_orcamentarias(id) on delete restrict,
  data_empenho date not null,
  valor_empenho numeric(12, 2) not null,
  status text not null default 'ativo',
  valor_anulado numeric(12, 2) not null default 0,
  data_anulacao date,
  motivo_anulacao text,
  criado_em timestamp default now(),
  constraint empenhos_valor_chk check (valor_empenho >= 0),
  constraint empenhos_status_chk check (status in ('ativo', 'anulado_parcial', 'anulado')),
  constraint empenhos_valor_anulado_chk check (valor_anulado >= 0 and valor_anulado <= valor_empenho)
);

create table if not exists afs (
  id varchar primary key default gen_random_uuid(),
  empenho_id varchar not null references empenhos(id) on delete restrict,
  data_pedido_af date not null,
  valor_af numeric(12, 2) not null,
  data_estimada_entrega date not null,
  data_entrega_real date,
  flag_entrega_notificada boolean default false,
  data_extensao date,
  criado_em timestamp default now(),
  constraint afs_valor_chk check (valor_af >= 0),
  constraint afs_data_entrega_chk check (data_entrega_real is null or data_entrega_real >= data_pedido_af),
  constraint afs_data_extensao_chk check (data_extensao is null or data_extensao >= data_estimada_entrega)
);

create table if not exists notas_fiscais (
  id varchar primary key default gen_random_uuid(),
  contrato_id varchar not null references contratos(id) on delete restrict,
  numero_nota text not null unique,
  valor_nota numeric(12, 2) not null,
  data_nota date not null,
  status_pagamento text not null default 'nota_recebida',
  numero_processo_pagamento text,
  data_envio_pagamento date,
  data_pagamento date,
  criado_em timestamp default now(),
  atualizado_em timestamp default now(),
  constraint notas_fiscais_valor_chk check (valor_nota >= 0),
  constraint notas_fiscais_status_chk check (status_pagamento in ('nota_recebida', 'aguardando_pagamento', 'pago')),
  constraint notas_fiscais_pagamento_chk check (data_pagamento is null or data_pagamento >= data_nota)
);

create table if not exists contrato_aditivos (
  id varchar primary key default gen_random_uuid(),
  contrato_id varchar not null references contratos(id) on delete cascade,
  numero_aditivo text not null,
  tipo_aditivo text not null,
  data_assinatura date not null,
  valor_aditivo numeric(12, 2),
  nova_vigencia_final date,
  justificativa text,
  criado_em timestamp default now(),
  constraint contrato_aditivos_tipo_chk check (tipo_aditivo in ('valor', 'vigencia', 'misto', 'apostilamento', 'outro')),
  constraint contrato_aditivos_valor_chk check (valor_aditivo is null or valor_aditivo >= 0)
);

create table if not exists contrato_anexos (
  id varchar primary key default gen_random_uuid(),
  contrato_id varchar not null references contratos(id) on delete cascade,
  nome_arquivo text not null,
  tipo_documento text not null,
  url_arquivo text not null,
  observacao text,
  criado_em timestamp default now()
);

create index if not exists idx_processos_digitais_departamento_id
  on processos_digitais (departamento_id);

create index if not exists idx_departamentos_ente_id
  on departamentos (ente_id);

create index if not exists idx_user_entes_user_id
  on user_entes (user_id);

create index if not exists idx_user_entes_ente_id
  on user_entes (ente_id);

create unique index if not exists idx_user_entes_unique
  on user_entes (user_id, ente_id);

create index if not exists idx_fases_contratacao_processo_digital_id
  on fases_contratacao (processo_digital_id);

create index if not exists idx_fases_contratacao_departamento_id
  on fases_contratacao (departamento_id);

create index if not exists idx_fases_contratacao_fornecedor_id
  on fases_contratacao (fornecedor_id);

create index if not exists idx_fichas_fonte_recurso_id
  on fichas_orcamentarias (fonte_recurso_id);

create index if not exists idx_contratos_processo_digital_id
  on contratos (processo_digital_id);

create index if not exists idx_contratos_fase_contratacao_id
  on contratos (fase_contratacao_id);

create index if not exists idx_contratos_departamento_id
  on contratos (departamento_id);

create index if not exists idx_contratos_fornecedor_id
  on contratos (fornecedor_id);

create index if not exists idx_atas_registro_preco_processo_digital_id
  on atas_registro_preco (processo_digital_id);

create index if not exists idx_ata_participantes_ata_id
  on ata_participantes (ata_id);

create index if not exists idx_ata_participantes_ente_id
  on ata_participantes (ente_id);

create unique index if not exists idx_ata_participantes_unique
  on ata_participantes (ata_id, ente_id);

create index if not exists idx_ata_fornecedores_ata_id
  on ata_fornecedores (ata_id);

create index if not exists idx_ata_fornecedores_fornecedor_id
  on ata_fornecedores (fornecedor_id);

create unique index if not exists idx_ata_fornecedores_unique
  on ata_fornecedores (ata_id, fornecedor_id);

create index if not exists idx_ata_itens_ata_id
  on ata_itens (ata_id);

create unique index if not exists idx_ata_itens_unique
  on ata_itens (ata_id, codigo_interno);

create index if not exists idx_ata_item_quantidades_item_id
  on ata_item_quantidades (item_id);

create index if not exists idx_ata_item_quantidades_ente_id
  on ata_item_quantidades (ente_id);

create unique index if not exists idx_ata_item_quantidades_unique
  on ata_item_quantidades (item_id, ente_id);

create index if not exists idx_ata_pre_pedidos_ata_id
  on ata_pre_pedidos (ata_id);

create index if not exists idx_ata_contratos_ata_id
  on ata_contratos (ata_id);

create index if not exists idx_ata_contratos_fornecedor_id
  on ata_contratos (fornecedor_id);

create index if not exists idx_ata_pre_pedidos_ata_contrato_id
  on ata_pre_pedidos (ata_contrato_id);

create index if not exists idx_ata_pre_pedidos_item_id
  on ata_pre_pedidos (item_id);

create index if not exists idx_ata_pre_pedidos_ente_id
  on ata_pre_pedidos (ente_id);

create index if not exists idx_ata_pre_pedidos_fonte_recurso_id
  on ata_pre_pedidos (fonte_recurso_id);

create index if not exists idx_ata_pre_pedidos_ficha_id
  on ata_pre_pedidos (ficha_id);

create index if not exists idx_ata_empenhos_contrato_id
  on ata_empenhos (ata_contrato_id);

create index if not exists idx_ata_empenhos_pre_pedido_id
  on ata_empenhos (ata_pre_pedido_id);

create index if not exists idx_ata_afs_empenho_id
  on ata_afs (ata_empenho_id);

create index if not exists idx_ata_notas_fiscais_contrato_id
  on ata_notas_fiscais (ata_contrato_id);

create index if not exists idx_ata_notas_fiscais_af_id
  on ata_notas_fiscais (ata_af_id);

create index if not exists idx_empenhos_contrato_id
  on empenhos (contrato_id);

create index if not exists idx_empenhos_fonte_recurso_id
  on empenhos (fonte_recurso_id);

create index if not exists idx_empenhos_ficha_id
  on empenhos (ficha_id);

create index if not exists idx_afs_empenho_id
  on afs (empenho_id);

create index if not exists idx_notas_fiscais_contrato_id
  on notas_fiscais (contrato_id);

create index if not exists idx_contrato_aditivos_contrato_id
  on contrato_aditivos (contrato_id);

create index if not exists idx_contrato_anexos_contrato_id
  on contrato_anexos (contrato_id);

create index if not exists idx_password_reset_tokens_user_id
  on password_reset_tokens (user_id);

create index if not exists idx_session_expire
  on session (expire);

create index if not exists idx_audit_logs_user_id
  on audit_logs (user_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_departamentos_updated_at on departamentos;
create trigger trg_departamentos_updated_at
before update on departamentos
for each row
execute function set_updated_at();

drop trigger if exists trg_fornecedores_updated_at on fornecedores;
create trigger trg_fornecedores_updated_at
before update on fornecedores
for each row
execute function set_updated_at();

drop trigger if exists trg_fontes_recurso_updated_at on fontes_recurso;
create trigger trg_fontes_recurso_updated_at
before update on fontes_recurso
for each row
execute function set_updated_at();

drop trigger if exists trg_processos_digitais_updated_at on processos_digitais;
create trigger trg_processos_digitais_updated_at
before update on processos_digitais
for each row
execute function set_updated_at();

drop trigger if exists trg_contratos_updated_at on contratos;
create trigger trg_contratos_updated_at
before update on contratos
for each row
execute function set_updated_at();

drop trigger if exists trg_atas_registro_preco_updated_at on atas_registro_preco;
create trigger trg_atas_registro_preco_updated_at
before update on atas_registro_preco
for each row
execute function set_updated_at();

drop trigger if exists trg_ata_itens_updated_at on ata_itens;
create trigger trg_ata_itens_updated_at
before update on ata_itens
for each row
execute function set_updated_at();

drop trigger if exists trg_ata_item_quantidades_updated_at on ata_item_quantidades;
create trigger trg_ata_item_quantidades_updated_at
before update on ata_item_quantidades
for each row
execute function set_updated_at();

drop trigger if exists trg_ata_item_cotacoes_updated_at on ata_item_cotacoes;
create trigger trg_ata_item_cotacoes_updated_at
before update on ata_item_cotacoes
for each row
execute function set_updated_at();

drop trigger if exists trg_ata_item_resultados_updated_at on ata_item_resultados;
create trigger trg_ata_item_resultados_updated_at
before update on ata_item_resultados
for each row
execute function set_updated_at();

drop trigger if exists trg_ata_pre_pedidos_updated_at on ata_pre_pedidos;
create trigger trg_ata_pre_pedidos_updated_at
before update on ata_pre_pedidos
for each row
execute function set_updated_at();

drop trigger if exists trg_ata_contratos_updated_at on ata_contratos;
create trigger trg_ata_contratos_updated_at
before update on ata_contratos
for each row
execute function set_updated_at();

drop trigger if exists trg_ata_notas_fiscais_updated_at on ata_notas_fiscais;
create trigger trg_ata_notas_fiscais_updated_at
before update on ata_notas_fiscais
for each row
execute function set_updated_at();

drop trigger if exists trg_notas_fiscais_updated_at on notas_fiscais;
create trigger trg_notas_fiscais_updated_at
before update on notas_fiscais
for each row
execute function set_updated_at();
