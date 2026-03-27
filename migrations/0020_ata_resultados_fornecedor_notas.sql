alter table public.ata_item_resultados
  add column if not exists fornecedor_id varchar references public.fornecedores(id) on delete set null;

create table if not exists public.ata_notas_fiscais (
  id varchar primary key default gen_random_uuid(),
  ata_contrato_id varchar not null references public.ata_contratos(id) on delete cascade,
  ata_af_id varchar not null references public.ata_afs(id) on delete cascade,
  numero_nota text not null,
  valor_nota numeric(14, 2) not null,
  data_nota date not null,
  status_pagamento text not null default 'nota_recebida',
  numero_processo_pagamento text,
  data_envio_pagamento date,
  data_pagamento date,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'ata_notas_fiscais_valor_chk'
  ) then
    alter table public.ata_notas_fiscais
      drop constraint ata_notas_fiscais_valor_chk;
  end if;
end $$;

alter table public.ata_notas_fiscais
  add constraint ata_notas_fiscais_valor_chk
  check (valor_nota >= 0);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'ata_notas_fiscais_status_chk'
  ) then
    alter table public.ata_notas_fiscais
      drop constraint ata_notas_fiscais_status_chk;
  end if;
end $$;

alter table public.ata_notas_fiscais
  add constraint ata_notas_fiscais_status_chk
  check (status_pagamento in ('nota_recebida', 'aguardando_pagamento', 'pago'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'ata_notas_fiscais_pagamento_chk'
  ) then
    alter table public.ata_notas_fiscais
      drop constraint ata_notas_fiscais_pagamento_chk;
  end if;
end $$;

alter table public.ata_notas_fiscais
  add constraint ata_notas_fiscais_pagamento_chk
  check (data_pagamento is null or data_pagamento >= data_nota);

create index if not exists idx_ata_notas_fiscais_contrato_id
  on public.ata_notas_fiscais (ata_contrato_id);

create index if not exists idx_ata_notas_fiscais_af_id
  on public.ata_notas_fiscais (ata_af_id);

drop trigger if exists trg_ata_notas_fiscais_updated_at on public.ata_notas_fiscais;
create trigger trg_ata_notas_fiscais_updated_at
before update on public.ata_notas_fiscais
for each row
execute function public.set_updated_at();
