-- Run this in the Supabase SQL Editor.
-- It fixes FK errors like:
-- seeds_user_id_fkey / diary_entries_user_id_fkey:
-- "Key is not present in table \"profiles\"."

insert into public.profiles (
  id,
  email,
  name,
  notification_time,
  notifications_enabled,
  onboarded
)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(
    users.raw_user_meta_data ->> 'name',
    split_part(coalesce(users.email, ''), '@', 1),
    'Usuario'
  ),
  '20:00',
  true,
  false
from auth.users
where not exists (
  select 1
  from public.profiles
  where profiles.id = users.id
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    notification_time,
    notifications_enabled,
    onboarded
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Usuario'
    ),
    '20:00',
    true,
    false
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profiles are viewable by owner'
  ) then
    create policy "Profiles are viewable by owner"
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profiles are insertable by owner'
  ) then
    create policy "Profiles are insertable by owner"
    on public.profiles
    for insert
    to authenticated
    with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profiles are updatable by owner'
  ) then
    create policy "Profiles are updatable by owner"
    on public.profiles
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;
end $$;
