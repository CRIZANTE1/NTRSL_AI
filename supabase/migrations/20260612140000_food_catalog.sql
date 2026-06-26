-- Catálogo de alimentos: cache local + dados USDA FDC (upsert via Edge Function)

create table public.food_catalog (
  id uuid primary key default gen_random_uuid(),
  fdc_id integer unique,
  local_key text unique,
  name_pt text not null,
  name_en text,
  source text not null check (source in ('local', 'fdc')),
  data_type text,
  calorias numeric(10, 2) not null default 0,
  proteina numeric(10, 2) not null default 0,
  carboidratos numeric(10, 2) not null default 0,
  gordura numeric(10, 2) not null default 0,
  aliases text[] not null default '{}',
  raw_fdc jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_catalog_name_pt_idx on public.food_catalog (name_pt);
create index food_catalog_name_en_idx on public.food_catalog (name_en);
create index food_catalog_fetched_at_idx on public.food_catalog (fetched_at desc);

create trigger food_catalog_updated_at before update on public.food_catalog
  for each row execute function public.set_updated_at();

alter table public.food_catalog enable row level security;

create policy food_catalog_select_authenticated on public.food_catalog
  for select to authenticated using (true);
