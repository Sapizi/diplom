begin;

alter table public.addresses
  add column if not exists street text,
  add column if not exists house text,
  add column if not exists entrance text,
  add column if not exists apartment text,
  add column if not exists floor text,
  add column if not exists comment text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

update public.addresses
set
  street = coalesce(street, postal_code::jsonb ->> 'street'),
  house = coalesce(house, postal_code::jsonb ->> 'house'),
  entrance = coalesce(entrance, postal_code::jsonb ->> 'entrance'),
  apartment = coalesce(apartment, postal_code::jsonb ->> 'apartment'),
  floor = coalesce(floor, postal_code::jsonb ->> 'floor'),
  comment = coalesce(comment, postal_code::jsonb ->> 'comment'),
  latitude = coalesce(latitude, nullif(postal_code::jsonb ->> 'latitude', '')::double precision),
  longitude = coalesce(longitude, nullif(postal_code::jsonb ->> 'longitude', '')::double precision)
where postal_code like '{%';

update public.addresses
set
  street = coalesce(street, ''),
  house = coalesce(house, ''),
  entrance = coalesce(entrance, ''),
  apartment = coalesce(apartment, ''),
  floor = coalesce(floor, '')
where true;

alter table public.addresses
  alter column street set default '',
  alter column street set not null,
  alter column house set default '',
  alter column house set not null,
  alter column entrance set default '',
  alter column entrance set not null,
  alter column apartment set default '',
  alter column apartment set not null,
  alter column floor set default '',
  alter column floor set not null;

alter table public.orders
  add column if not exists delivery_address_id uuid references public.addresses(id) on delete set null,
  add column if not exists delivery_city text,
  add column if not exists delivery_street text,
  add column if not exists delivery_house text,
  add column if not exists delivery_entrance text,
  add column if not exists delivery_apartment text,
  add column if not exists delivery_floor text,
  add column if not exists delivery_comment text,
  add column if not exists delivery_latitude double precision,
  add column if not exists delivery_longitude double precision;

create index if not exists idx_addresses_user_id_created_at
  on public.addresses(user_id, created_at desc);

create index if not exists idx_orders_delivery_address_id
  on public.orders(delivery_address_id);

commit;
