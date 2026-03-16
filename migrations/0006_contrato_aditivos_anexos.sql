create table if not exists public.contrato_aditivos (
  id varchar primary key default gen_random_uuid(),
  contrato_id varchar not null references public.contratos(id) on delete cascade,
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

create index if not exists idx_contrato_aditivos_contrato_id
  on public.contrato_aditivos (contrato_id);

create table if not exists public.contrato_anexos (
  id varchar primary key default gen_random_uuid(),
  contrato_id varchar not null references public.contratos(id) on delete cascade,
  nome_arquivo text not null,
  tipo_documento text not null,
  url_arquivo text not null,
  observacao text,
  criado_em timestamp default now()
);

create index if not exists idx_contrato_anexos_contrato_id
  on public.contrato_anexos (contrato_id);
