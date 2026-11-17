-- Trinity Mark 360 · General Manager and department portals.
-- Adds the roles gm (General Manager), clientservice, creative and operations. Safe to run again.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('ceo', 'gm', 'staff', 'finance', 'reception', 'store', 'production', 'clientservice', 'creative', 'operations'));

create or replace function private.create_account(p_email text, p_password text, p_full_name text, p_role text, p_title text, p_person_key text, p_is_admin boolean, p_is_demo boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := gen_random_uuid(); em text := lower(trim(p_email));
begin
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  if p_role not in ('ceo', 'gm', 'staff', 'finance', 'reception', 'store', 'production', 'clientservice', 'creative', 'operations') then raise exception 'Unknown portal: %', p_role; end if;
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

create or replace function public.admin_update_user(p_user uuid, p_full_name text, p_role text, p_title text, p_person_key text, p_is_admin boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only an administrator can manage accounts'; end if;
  if p_role not in ('ceo', 'gm', 'staff', 'finance', 'reception', 'store', 'production', 'clientservice', 'creative', 'operations') then raise exception 'Unknown portal: %', p_role; end if;
  if p_user = auth.uid() and not p_is_admin then raise exception 'You cannot remove your own administrator access'; end if;
  update public.profiles set full_name = p_full_name, role = p_role, title = coalesce(p_title, ''), person_key = nullif(upper(trim(p_person_key)), ''), is_admin = p_is_admin
    where user_id = p_user;
end $$;
