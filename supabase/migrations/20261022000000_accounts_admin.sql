-- Trinity Mark 360 · accounts, administrators and demo removal.
-- Applied to project mvjodqspewbjyroygsre on 22 Oct 2026. Safe to run again.

-- Who can manage accounts, and which accounts/data belong to the demo.
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists is_demo boolean not null default false;

-- Everyone signed in can see colleagues' names (shown on tasks, requests, approvals…).
-- (Renamed from "Read own profile or all as management".)
do $$ begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Read own profile or all as management') then
    alter policy "Read own profile or all as management" on public.profiles rename to "Staff read profiles";
  end if;
end $$;
alter policy "Staff read profiles" on public.profiles using (true);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and is_admin);
$$;
alter policy "Management manages profiles" on public.profiles using ((select public.is_admin())) with check ((select public.is_admin()));

-- Private helper that creates a sign-in account; not callable from the app directly.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.create_account(p_email text, p_password text, p_full_name text, p_role text, p_title text, p_person_key text, p_is_admin boolean, p_is_demo boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := gen_random_uuid(); em text := lower(trim(p_email));
begin
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  if p_role not in ('ceo', 'staff', 'finance', 'reception', 'store', 'production') then raise exception 'Unknown portal: %', p_role; end if;
  if exists (select 1 from auth.users where email = em) then raise exception 'An account with % already exists', em; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name), now(), now(), '', '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true, 'phone_verified', false), 'email', now(), now(), now());
  insert into public.profiles (user_id, full_name, title, role, person_key, is_admin, is_demo)
  values (uid, coalesce(p_full_name, ''), coalesce(p_title, ''), p_role, nullif(upper(trim(p_person_key)), ''), coalesce(p_is_admin, false), coalesce(p_is_demo, false))
  on conflict (user_id) do update set full_name = excluded.full_name, title = excluded.title, role = excluded.role,
    person_key = excluded.person_key, is_admin = excluded.is_admin, is_demo = excluded.is_demo;
  return uid;
end $$;
revoke all on function private.create_account(text, text, text, text, text, text, boolean, boolean) from public, anon, authenticated;

-- Functions the Users & access screen calls. Each refuses anyone who is not an administrator.
create or replace function public.admin_list_users()
returns table (user_id uuid, email text, full_name text, title text, role text, person_key text, is_admin boolean, is_demo boolean, last_sign_in_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only an administrator can manage accounts'; end if;
  return query select p.user_id, u.email::text, p.full_name, p.title, p.role, p.person_key, p.is_admin, p.is_demo, u.last_sign_in_at, p.created_at
    from public.profiles p join auth.users u on u.id = p.user_id order by p.is_admin desc, p.is_demo, p.created_at;
end $$;

create or replace function public.admin_create_user(p_email text, p_password text, p_full_name text, p_role text, p_title text default '', p_person_key text default '', p_is_admin boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only an administrator can manage accounts'; end if;
  return private.create_account(p_email, p_password, p_full_name, p_role, p_title, p_person_key, p_is_admin, false);
end $$;

create or replace function public.admin_update_user(p_user uuid, p_full_name text, p_role text, p_title text, p_person_key text, p_is_admin boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only an administrator can manage accounts'; end if;
  if p_role not in ('ceo', 'staff', 'finance', 'reception', 'store', 'production') then raise exception 'Unknown portal: %', p_role; end if;
  if p_user = auth.uid() and not p_is_admin then raise exception 'You cannot remove your own administrator access'; end if;
  update public.profiles set full_name = p_full_name, role = p_role, title = coalesce(p_title, ''), person_key = nullif(upper(trim(p_person_key)), ''), is_admin = p_is_admin
    where user_id = p_user;
end $$;

create or replace function public.admin_set_password(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only an administrator can manage accounts'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_user;
end $$;

create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only an administrator can manage accounts'; end if;
  if p_user = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  delete from auth.users where id = p_user;
end $$;

-- One tap: delete demo accounts and every demo record, leaving an empty company workspace.
create or replace function public.admin_remove_demo()
returns json language plpgsql security definer set search_path = '' as $$
declare n_users int; n_rows int;
begin
  if not public.is_admin() then raise exception 'Only an administrator can manage accounts'; end if;
  delete from auth.users where id in (select user_id from public.profiles where is_demo and user_id <> auth.uid());
  get diagnostics n_users = row_count;
  delete from public.app_records where collection <> '_meta';
  get diagnostics n_rows = row_count;
  insert into public.app_records (collection, id, position, data) values ('_meta', 'workspace', 0, jsonb_build_object('mode', 'live', 'since', now()))
    on conflict (collection, id) do update set data = excluded.data;
  return json_build_object('users_removed', n_users, 'records_removed', n_rows);
end $$;

revoke execute on function public.admin_list_users(), public.admin_create_user(text, text, text, text, text, text, boolean), public.admin_update_user(uuid, text, text, text, text, boolean),
  public.admin_set_password(uuid, text), public.admin_delete_user(uuid), public.admin_remove_demo(), public.is_admin() from public, anon;
grant execute on function public.admin_list_users(), public.admin_create_user(text, text, text, text, text, text, boolean), public.admin_update_user(uuid, text, text, text, text, boolean),
  public.admin_set_password(uuid, text), public.admin_delete_user(uuid), public.admin_remove_demo(), public.is_admin() to authenticated;

-- Only the database calls these (as a trigger / no longer used): nobody can call them directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_management() from public, anon, authenticated;
