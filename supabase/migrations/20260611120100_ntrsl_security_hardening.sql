revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

alter function public.set_updated_at() set search_path = public;

insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'name'
  ),
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
