create table if not exists public.ata_fornecedores (
  id varchar primary key default gen_random_uuid(),
  ata_id varchar not null references public.atas_registro_preco(id) on delete cascade,
  fornecedor_id varchar not null references public.fornecedores(id) on delete restrict,
  criado_em timestamp default now()
);

create index if not exists idx_ata_fornecedores_ata_id
  on public.ata_fornecedores (ata_id);

create index if not exists idx_ata_fornecedores_fornecedor_id
  on public.ata_fornecedores (fornecedor_id);

create unique index if not exists idx_ata_fornecedores_unique
  on public.ata_fornecedores (ata_id, fornecedor_id);

alter table public.ata_contratos
  add column if not exists fornecedor_id varchar references public.fornecedores(id) on delete restrict;

insert into public.ata_fornecedores (id, ata_id, fornecedor_id, criado_em)
select
  gen_random_uuid()::varchar,
  c.ata_id,
  c.fornecedor_id,
  now()
from public.ata_contratos c
where c.fornecedor_id is not null
  and not exists (
    select 1
    from public.ata_fornecedores af
    where af.ata_id = c.ata_id
      and af.fornecedor_id = c.fornecedor_id
  );

alter table public.ata_contratos
  alter column fornecedor_id set not null;

create index if not exists idx_ata_contratos_fornecedor_id
  on public.ata_contratos (fornecedor_id);
