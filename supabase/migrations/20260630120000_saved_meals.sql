create table public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index saved_meals_user_created_idx on public.saved_meals (user_id, created_at desc);

alter table public.saved_meals enable row level security;

create policy saved_meals_select_own on public.saved_meals
  for select using (auth.uid() = user_id);

create policy saved_meals_insert_own on public.saved_meals
  for insert with check (auth.uid() = user_id);

create policy saved_meals_delete_own on public.saved_meals
  for delete using (auth.uid() = user_id);
