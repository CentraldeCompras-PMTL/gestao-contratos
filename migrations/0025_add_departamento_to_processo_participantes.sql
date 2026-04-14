begin;

alter table public.processo_participantes
  add column if not exists departamento_id varchar references public.departamentos(id);

commit;
