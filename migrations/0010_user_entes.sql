create table if not exists public.user_entes (
  id varchar primary key default gen_random_uuid(),
  user_id varchar not null references public.users(id) on delete cascade,
  ente_id varchar not null references public.entes(id) on delete cascade,
  created_at timestamp default now()
);

create index if not exists idx_user_entes_user_id
  on public.user_entes (user_id);

create index if not exists idx_user_entes_ente_id
  on public.user_entes (ente_id);

create unique index if not exists idx_user_entes_unique
  on public.user_entes (user_id, ente_id);

insert into public.user_entes (id, user_id, ente_id, created_at)
select
  gen_random_uuid()::varchar,
  u.id,
  u.ente_id,
  now()
from public.users u
where u.role = 'operacional'
  and u.ente_id is not null
  and not exists (
    select 1
    from public.user_entes ue
    where ue.user_id = u.id
      and ue.ente_id = u.ente_id
  );
