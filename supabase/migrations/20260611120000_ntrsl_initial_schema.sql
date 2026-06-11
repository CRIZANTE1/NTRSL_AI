-- NTRSL AI — schema inicial (espelha migration aplicada via MCP)

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  exercises jsonb not null default '[]'::jsonb,
  foods jsonb not null default '[]'::jsonb,
  summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);

create table public.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_request_at timestamptz not null default now()
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fcm_token text not null,
  platform text not null check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fcm_token)
);

create index push_tokens_user_idx on public.push_tokens (user_id);

create table public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  kind text not null check (kind in ('action', 'critical_error')),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  action text,
  entity_type text,
  entity_id text,
  severity text,
  message text,
  stack text,
  route text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index security_audit_events_actor_idx on public.security_audit_events (actor_user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger daily_logs_updated_at before update on public.daily_logs
  for each row execute function public.set_updated_at();
create trigger push_tokens_updated_at before update on public.push_tokens
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.ai_usage enable row level security;
alter table public.push_tokens enable row level security;
alter table public.security_audit_events enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy daily_logs_select_own on public.daily_logs for select using (auth.uid() = user_id);
create policy daily_logs_insert_own on public.daily_logs for insert with check (auth.uid() = user_id);
create policy daily_logs_update_own on public.daily_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy daily_logs_delete_own on public.daily_logs for delete using (auth.uid() = user_id);

create policy ai_usage_select_own on public.ai_usage for select using (auth.uid() = user_id);

create policy push_tokens_select_own on public.push_tokens for select using (auth.uid() = user_id);
create policy push_tokens_insert_own on public.push_tokens for insert with check (auth.uid() = user_id);
create policy push_tokens_update_own on public.push_tokens for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy push_tokens_delete_own on public.push_tokens for delete using (auth.uid() = user_id);

create policy security_audit_insert_own on public.security_audit_events
  for insert with check (auth.uid() = actor_user_id);
create policy security_audit_select_own on public.security_audit_events
  for select using (auth.uid() = actor_user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_public_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_insert_own on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy avatars_update_own on storage.objects for update using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy avatars_delete_own on storage.objects for delete using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
