begin;

alter table public.orders
  add column if not exists courier_id uuid references public.profiles(id) on delete set null,
  add column if not exists courier_status text,
  add column if not exists courier_assigned_at timestamptz,
  add column if not exists delivery_started_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists courier_latitude double precision,
  add column if not exists courier_longitude double precision,
  add column if not exists courier_location_updated_at timestamptz,
  add column if not exists customer_tracking_enabled boolean not null default false,
  add column if not exists estimated_delivery_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_courier_status_check'
  ) then
    alter table public.orders
      add constraint orders_courier_status_check
      check (
        courier_status is null
        or courier_status in (
          'awaiting_assignment',
          'assigned',
          'on_the_way',
          'arrived',
          'delivered',
          'cancelled'
        )
      );
  end if;
end $$;

create index if not exists idx_orders_courier_id
  on public.orders(courier_id);

create index if not exists idx_orders_courier_status
  on public.orders(courier_status);

create index if not exists idx_orders_customer_tracking_enabled
  on public.orders(customer_tracking_enabled);

create table if not exists public.courier_location_history (
  id uuid primary key default extensions.uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid not null references public.profiles(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_courier_location_history_order_created_at
  on public.courier_location_history(order_id, created_at desc);

create index if not exists idx_courier_location_history_courier_created_at
  on public.courier_location_history(courier_id, created_at desc);

comment on column public.orders.courier_status is
  'Статус именно доставки курьером: awaiting_assignment, assigned, on_the_way, arrived, delivered, cancelled';

comment on column public.orders.customer_tracking_enabled is
  'Можно ли уже показывать клиенту движение курьера на карте';

commit;
