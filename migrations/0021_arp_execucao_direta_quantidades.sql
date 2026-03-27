alter table public.ata_empenhos
  alter column ata_contrato_id drop not null;

alter table public.ata_afs
  add column if not exists quantidade_af numeric(14, 2);

update public.ata_afs af
set quantidade_af = e.quantidade_empenhada
from public.ata_empenhos e
where e.id = af.ata_empenho_id
  and af.quantidade_af is null;

alter table public.ata_afs
  alter column quantidade_af set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'ata_afs_quantidade_chk'
  ) then
    alter table public.ata_afs
      drop constraint ata_afs_quantidade_chk;
  end if;
end $$;

alter table public.ata_afs
  add constraint ata_afs_quantidade_chk
  check (quantidade_af > 0);

alter table public.ata_notas_fiscais
  alter column ata_contrato_id drop not null;

alter table public.ata_notas_fiscais
  add column if not exists quantidade_nota numeric(14, 2);

update public.ata_notas_fiscais n
set quantidade_nota = af.quantidade_af
from public.ata_afs af
where af.id = n.ata_af_id
  and n.quantidade_nota is null;

alter table public.ata_notas_fiscais
  alter column quantidade_nota set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'ata_notas_fiscais_quantidade_chk'
  ) then
    alter table public.ata_notas_fiscais
      drop constraint ata_notas_fiscais_quantidade_chk;
  end if;
end $$;

alter table public.ata_notas_fiscais
  add constraint ata_notas_fiscais_quantidade_chk
  check (quantidade_nota > 0);
