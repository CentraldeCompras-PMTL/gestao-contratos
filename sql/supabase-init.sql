create extension if not exists pgcrypto;

create table if not exists users (
  id varchar primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  name text,
  role text not null default 'operacional',
  ente_id varchar,
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

create table if not exists empenhos (
  id varchar primary key default gen_random_uuid(),
  contrato_id varchar not null references contratos(id) on delete restrict,
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

create index if not exists idx_fases_contratacao_processo_digital_id
  on fases_contratacao (processo_digital_id);

create index if not exists idx_fases_contratacao_fornecedor_id
  on fases_contratacao (fornecedor_id);

create index if not exists idx_contratos_processo_digital_id
  on contratos (processo_digital_id);

create index if not exists idx_contratos_fase_contratacao_id
  on contratos (fase_contratacao_id);

create index if not exists idx_contratos_fornecedor_id
  on contratos (fornecedor_id);

create index if not exists idx_empenhos_contrato_id
  on empenhos (contrato_id);

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

drop trigger if exists trg_notas_fiscais_updated_at on notas_fiscais;
create trigger trg_notas_fiscais_updated_at
before update on notas_fiscais
for each row
execute function set_updated_at();
