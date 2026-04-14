begin;

alter table public.fichas_orcamentarias
  alter column classificacao drop not null;

commit;
