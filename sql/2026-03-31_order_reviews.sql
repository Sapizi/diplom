create extension if not exists pgcrypto;

create table if not exists public.order_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint order_reviews_order_user_unique unique (order_id, user_id)
);

create index if not exists order_reviews_order_id_idx on public.order_reviews(order_id);
create index if not exists order_reviews_user_id_idx on public.order_reviews(user_id);
