alter table public.users
  add column if not exists can_access_ata_module boolean not null default false;

update public.users
set can_access_ata_module = true
where lower(email) = 'admin@admin.com'
  and can_access_ata_module = false;
