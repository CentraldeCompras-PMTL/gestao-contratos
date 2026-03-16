alter table public.notas_fiscais
  alter column status_pagamento set default 'nota_recebida';

alter table public.notas_fiscais
  add column if not exists numero_processo_pagamento text,
  add column if not exists data_envio_pagamento date;

update public.notas_fiscais
set status_pagamento = 'nota_recebida'
where status_pagamento is null
   or status_pagamento = 'pendente';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'notas_fiscais_status_chk'
  ) then
    alter table public.notas_fiscais
      drop constraint notas_fiscais_status_chk;
  end if;
end $$;

alter table public.notas_fiscais
  add constraint notas_fiscais_status_chk
  check (status_pagamento in ('nota_recebida', 'aguardando_pagamento', 'pago'));
