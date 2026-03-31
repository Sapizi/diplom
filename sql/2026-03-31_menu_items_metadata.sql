alter table public.menu_items
  add column if not exists calories integer,
  add column if not exists is_available boolean not null default true;

update public.menu_items
set is_available = true
where is_available is null;
