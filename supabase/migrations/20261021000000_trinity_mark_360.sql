-- Trinity Mark 360 · database setup for project mvjodqspewbjyroygsre.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again: every statement checks before creating.

-- 1. People who can sign in, and which portal each one uses.
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  title       text not null default '',
  -- ceo = Management, staff, finance, reception, store
  role        text not null default 'staff' check (role in ('ceo', 'staff', 'finance', 'reception', 'store')),
  -- Initials used across the app's records, e.g. 'DK' for Daniel K.
  person_key  text,
  created_at  timestamptz not null default now()
);

-- 2. All business data. One row per item (project, task, request, invoice…).
create table if not exists public.app_records (
  collection  text not null,
  id          text not null,
  position    integer not null default 0,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid() references auth.users (id) on delete set null,
  primary key (collection, id)
);
create index if not exists app_records_collection_position on public.app_records (collection, position);

create or replace function public.touch_app_record() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
drop trigger if exists app_records_touch on public.app_records;
create trigger app_records_touch before insert or update on public.app_records
  for each row execute function public.touch_app_record();

-- 3. Every new sign-in account gets a profile (Staff portal until changed).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for accounts that existed before this script.
insert into public.profiles (user_id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)) from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_management() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'ceo');
$$;

-- 4. Access rules: only signed-in staff see or change anything.
alter table public.profiles enable row level security;
alter table public.app_records enable row level security;

drop policy if exists "Read own profile or all as management" on public.profiles;
create policy "Read own profile or all as management" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "Management manages profiles" on public.profiles;
create policy "Management manages profiles" on public.profiles
  for update to authenticated using ((select public.is_management())) with check ((select public.is_management()));

drop policy if exists "Staff read records" on public.app_records;
create policy "Staff read records" on public.app_records
  for select to authenticated using (true);
drop policy if exists "Staff add records" on public.app_records;
create policy "Staff add records" on public.app_records
  for insert to authenticated with check (true);
drop policy if exists "Staff update records" on public.app_records;
create policy "Staff update records" on public.app_records
  for update to authenticated using (true) with check (true);
drop policy if exists "Staff delete records" on public.app_records;
create policy "Staff delete records" on public.app_records
  for delete to authenticated using (true);

-- 5. Live updates: changes show on every open screen straight away.
alter table public.app_records replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'app_records') then
    alter publication supabase_realtime add table public.app_records;
  end if;
end $$;
