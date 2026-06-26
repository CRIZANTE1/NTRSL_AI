-- =============================================================================
-- NTRSL — setup de banco para food-search (cole no Supabase SQL Editor)
-- =============================================================================
--
-- IMPORTANTE: este script prepara apenas a TABELA food_catalog no Postgres.
-- A Edge Function `food-search` (código Deno) NÃO pode ser publicada pelo SQL Editor.
--
-- Depois de rodar este SQL, faça o deploy da função no terminal (mais rápido que MCP):
--   supabase link --project-ref aumvxnccdhcrftvnliwa
--   supabase secrets set FDC_API_KEY=<sua-chave-usda>
--   supabase functions deploy food-search
--
-- Projeto: aumvxnccdhcrftvnliwa
-- =============================================================================

-- Função auxiliar (idempotente; já existe se migrations iniciais foram aplicadas)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Catálogo de alimentos: cache local + USDA FDC (upsert via Edge Function food-search)
create table if not exists public.food_catalog (
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

create index if not exists food_catalog_name_pt_idx
  on public.food_catalog (name_pt);

create index if not exists food_catalog_name_en_idx
  on public.food_catalog (name_en);

create index if not exists food_catalog_fetched_at_idx
  on public.food_catalog (fetched_at desc);

drop trigger if exists food_catalog_updated_at on public.food_catalog;
create trigger food_catalog_updated_at
  before update on public.food_catalog
  for each row execute function public.set_updated_at();

alter table public.food_catalog enable row level security;

drop policy if exists food_catalog_select_authenticated on public.food_catalog;
create policy food_catalog_select_authenticated on public.food_catalog
  for select to authenticated using (true);

-- =============================================================================
-- Verificação (deve retornar 1 linha com colunas da tabela)
-- =============================================================================
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'food_catalog'
order by ordinal_position;
