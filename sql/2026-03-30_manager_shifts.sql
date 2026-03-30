begin;

create table if not exists public.employee_shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  comment text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_shifts_time_check check (start_time < end_time)
);

create unique index if not exists idx_employee_shifts_employee_date_start
  on public.employee_shifts(employee_id, shift_date, start_time);

create index if not exists idx_employee_shifts_date_start
  on public.employee_shifts(shift_date, start_time);

create index if not exists idx_employee_shifts_employee_date
  on public.employee_shifts(employee_id, shift_date desc);

alter table public.employee_shifts enable row level security;

commit;
