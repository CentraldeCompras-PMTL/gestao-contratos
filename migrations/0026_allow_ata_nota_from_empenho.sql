begin;

alter table public.ata_notas_fiscais
  add column if not exists ata_empenho_id varchar references public.ata_empenhos(id);

update public.ata_notas_fiscais as nota
set ata_empenho_id = af.ata_empenho_id
from public.ata_afs as af
where nota.ata_af_id = af.id
  and nota.ata_empenho_id is null;

alter table public.ata_notas_fiscais
  alter column ata_af_id drop not null;

commit;
