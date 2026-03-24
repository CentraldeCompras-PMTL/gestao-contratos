create table if not exists public.fontes_recurso (
  id varchar primary key default gen_random_uuid(),
  nome text not null,
  codigo text not null unique,
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

create table if not exists public.fichas_orcamentarias (
  id varchar primary key default gen_random_uuid(),
  fonte_recurso_id varchar not null references public.fontes_recurso(id) on delete restrict,
  codigo text not null,
  classificacao text not null,
  criado_em timestamp default now()
);

create unique index if not exists idx_fontes_recurso_codigo
  on public.fontes_recurso (codigo);

create unique index if not exists idx_fichas_unique
  on public.fichas_orcamentarias (fonte_recurso_id, codigo);

create index if not exists idx_fichas_fonte_recurso_id
  on public.fichas_orcamentarias (fonte_recurso_id);

alter table public.empenhos
  add column if not exists fonte_recurso_id varchar references public.fontes_recurso(id) on delete restrict,
  add column if not exists ficha_id varchar references public.fichas_orcamentarias(id) on delete restrict;

insert into public.fontes_recurso (id, nome, codigo, criado_em, atualizado_em)
select gen_random_uuid()::varchar, 'Fonte nao informada', '9.999.9999', now(), now()
where not exists (
  select 1 from public.fontes_recurso where codigo = '9.999.9999'
);

insert into public.fichas_orcamentarias (id, fonte_recurso_id, codigo, classificacao, criado_em)
select gen_random_uuid()::varchar, fr.id, '999', 'consumo', now()
from public.fontes_recurso fr
where fr.codigo = '9.999.9999'
  and not exists (
    select 1 from public.fichas_orcamentarias fi
    where fi.fonte_recurso_id = fr.id and fi.codigo = '999'
  );

update public.empenhos e
set
  fonte_recurso_id = fr.id,
  ficha_id = fi.id
from public.fontes_recurso fr,
     public.fichas_orcamentarias fi
where fr.codigo = '9.999.9999'
  and fi.fonte_recurso_id = fr.id
  and fi.codigo = '999'
  and (e.fonte_recurso_id is null or e.ficha_id is null);

alter table public.empenhos
  alter column fonte_recurso_id set not null,
  alter column ficha_id set not null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'fichas_classificacao_chk'
  ) then
    alter table public.fichas_orcamentarias drop constraint fichas_classificacao_chk;
  end if;
end $$;

alter table public.fichas_orcamentarias
  add constraint fichas_classificacao_chk
  check (classificacao in ('consumo', 'servico', 'permanente'));
