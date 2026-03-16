alter table "users"
  add column if not exists "role" text not null default 'operacional';

update "users"
set "role" = 'admin'
where lower("email") = 'admin@admin.com'
  and ("role" is null or "role" = 'operacional');
