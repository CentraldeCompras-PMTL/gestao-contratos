begin;

create table if not exists public.classificacoes_orcamentarias (
  id varchar primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  criado_em timestamp default now()
);

alter table public.fichas_orcamentarias
  add column if not exists classificacao_id varchar references public.classificacoes_orcamentarias(id);

insert into public.classificacoes_orcamentarias (id, nome, descricao, criado_em)
select
  gen_random_uuid()::varchar,
  case
    when trim(lower(f.classificacao)) = 'consumo' then 'Material de Consumo'
    when trim(lower(f.classificacao)) = 'permanente' then 'Material Permanente'
    when trim(lower(f.classificacao)) = 'servico' then 'Servico'
    else initcap(replace(trim(f.classificacao), '_', ' '))
  end,
  null,
  now()
from (
  select distinct classificacao
  from public.fichas_orcamentarias
  where classificacao is not null
    and trim(classificacao) <> ''
) f
where not exists (
  select 1
  from public.classificacoes_orcamentarias c
  where c.nome = case
    when trim(lower(f.classificacao)) = 'consumo' then 'Material de Consumo'
    when trim(lower(f.classificacao)) = 'permanente' then 'Material Permanente'
    when trim(lower(f.classificacao)) = 'servico' then 'Servico'
    else initcap(replace(trim(f.classificacao), '_', ' '))
  end
);

update public.fichas_orcamentarias f
set classificacao_id = c.id
from public.classificacoes_orcamentarias c
where f.classificacao_id is null
  and f.classificacao is not null
  and c.nome = case
    when trim(lower(f.classificacao)) = 'consumo' then 'Material de Consumo'
    when trim(lower(f.classificacao)) = 'permanente' then 'Material Permanente'
    when trim(lower(f.classificacao)) = 'servico' then 'Servico'
    else initcap(replace(trim(f.classificacao), '_', ' '))
  end;

alter table public.processos_digitais
  add column if not exists ente_id varchar references public.entes(id);

update public.processos_digitais p
set ente_id = d.ente_id
from public.departamentos d
where p.ente_id is null
  and p.departamento_id = d.id
  and d.ente_id is not null;

alter table public.fases_contratacao
  add column if not exists ente_id varchar references public.entes(id);

update public.fases_contratacao f
set ente_id = coalesce(
  (select d.ente_id from public.departamentos d where d.id = f.departamento_id),
  (select p.ente_id from public.processos_digitais p where p.id = f.processo_digital_id)
)
where f.ente_id is null;

alter table public.contratos
  add column if not exists ente_id varchar references public.entes(id);

update public.contratos c
set ente_id = coalesce(
  (select d.ente_id from public.departamentos d where d.id = c.departamento_id),
  (select f.ente_id from public.fases_contratacao f where f.id = c.fase_contratacao_id),
  (select p.ente_id from public.processos_digitais p where p.id = c.processo_digital_id)
)
where c.ente_id is null;

alter table public.processo_participantes
  add column if not exists ente_id varchar references public.entes(id);

update public.processo_participantes pp
set ente_id = d.ente_id
from public.departamentos d
where pp.ente_id is null
  and pp.departamento_id = d.id
  and d.ente_id is not null;

alter table public.processo_item_quantidades
  add column if not exists ente_id varchar references public.entes(id);

update public.processo_item_quantidades piq
set ente_id = d.ente_id
from public.departamentos d
where piq.ente_id is null
  and piq.departamento_id = d.id
  and d.ente_id is not null;

create temporary table tmp_processo_item_quantidades as
select
  gen_random_uuid()::varchar as id,
  item_id,
  ente_id,
  sum(quantidade)::numeric(14, 2) as quantidade,
  min(criado_em) as criado_em,
  max(atualizado_em) as atualizado_em
from public.processo_item_quantidades
where ente_id is not null
group by item_id, ente_id;

alter table public.processo_item_quantidades
  alter column departamento_id drop not null;

delete from public.processo_item_quantidades;

insert into public.processo_item_quantidades (
  id,
  item_id,
  ente_id,
  quantidade,
  criado_em,
  atualizado_em
)
select
  id,
  item_id,
  ente_id,
  quantidade,
  coalesce(criado_em, now()),
  coalesce(atualizado_em, now())
from tmp_processo_item_quantidades;

drop table tmp_processo_item_quantidades;

create temporary table tmp_processo_participantes as
select
  gen_random_uuid()::varchar as id,
  processo_id,
  ente_id,
  min(criado_em) as criado_em
from public.processo_participantes
where ente_id is not null
group by processo_id, ente_id;

alter table public.processo_participantes
  alter column departamento_id drop not null;

delete from public.processo_participantes;

insert into public.processo_participantes (
  id,
  processo_id,
  ente_id,
  criado_em
)
select
  id,
  processo_id,
  ente_id,
  coalesce(criado_em, now())
from tmp_processo_participantes;

drop table tmp_processo_participantes;

alter table public.processo_participantes
  alter column ente_id set not null;

alter table public.processo_item_quantidades
  alter column ente_id set not null;

alter table public.processo_participantes
  drop column if exists departamento_id;

alter table public.processo_item_quantidades
  drop column if exists departamento_id;

commit;
