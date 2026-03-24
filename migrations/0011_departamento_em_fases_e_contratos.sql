alter table public.fases_contratacao
  add column if not exists departamento_id varchar references public.departamentos(id) on delete set null;

alter table public.contratos
  add column if not exists departamento_id varchar references public.departamentos(id) on delete set null;

create index if not exists idx_fases_contratacao_departamento_id
  on public.fases_contratacao (departamento_id);

create index if not exists idx_contratos_departamento_id
  on public.contratos (departamento_id);

update public.fases_contratacao f
set departamento_id = p.departamento_id
from public.processos_digitais p
where p.id = f.processo_digital_id
  and f.departamento_id is null;

update public.contratos c
set departamento_id = coalesce(f.departamento_id, p.departamento_id)
from public.fases_contratacao f
join public.processos_digitais p on p.id = c.processo_digital_id
where f.id = c.fase_contratacao_id
  and c.departamento_id is null;
