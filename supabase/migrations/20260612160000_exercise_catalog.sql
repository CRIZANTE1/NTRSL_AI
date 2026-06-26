-- Catálogo de exercícios: cache local + dados WGER (upsert via Edge Function)

create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  wger_id integer unique,
  local_key text unique,
  name_pt text not null,
  name_en text,
  source text not null check (source in ('local', 'wger')),
  category text,
  calorias_por_minuto numeric(10, 2) not null default 0,
  aliases text[] not null default '{}',
  raw_wger jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercise_catalog_name_pt_idx on public.exercise_catalog (name_pt);
create index exercise_catalog_name_en_idx on public.exercise_catalog (name_en);
create index exercise_catalog_fetched_at_idx on public.exercise_catalog (fetched_at desc);

create trigger exercise_catalog_updated_at before update on public.exercise_catalog
  for each row execute function public.set_updated_at();

alter table public.exercise_catalog enable row level security;

create policy exercise_catalog_select_authenticated on public.exercise_catalog
  for select to authenticated using (true);
