create table if not exists public.session (
  sid varchar not null collate "default" primary key,
  sess json not null,
  expire timestamp(6) not null
);

create index if not exists idx_session_expire
  on public.session (expire);
