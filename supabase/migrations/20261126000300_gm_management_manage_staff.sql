-- Trinity Mark 360 · Management and the General Manager add and remove staff accounts.
-- Until now only administrators could. Now Management (role 'ceo') and the GM (role 'gm') can also list,
-- create, change, reset passwords for and delete accounts, with these limits (checked here, not only in the app):
--   · only administrators give or take away administrator access, and only they touch administrators' accounts;
--   · only administrators and Management create Management accounts or move someone into Management;
--   · the GM cannot change or delete a Management account;
--   · nobody deletes their own account.
-- Removing the demo stays with administrators. Safe to run again.

create or replace function public.can_manage_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and (is_admin or role in ('ceo', 'gm')));
$$;

-- May the person signed in change or remove this account?
create or replace function private.may_manage(p_user uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare me public.profiles; them public.profiles;
begin
  select * into me from public.profiles where user_id = auth.uid();
  select * into them from public.profiles where user_id = p_user;
  if me.user_id is null then return false; end if;
  if me.is_admin then return true; end if;
  if me.role not in ('ceo', 'gm') then return false; end if;
  if them.user_id is null then return true; end if;
  if them.is_admin then return false; end if;
  if me.role = 'gm' and them.role = 'ceo' then return false; end if;
  return true;
end $$;
revoke all on function private.may_manage(uuid) from public, anon, authenticated;

create or replace function public.admin_list_users()
returns table (user_id uuid, email text, full_name text, title text, role text, person_key text, is_admin boolean, is_demo boolean, last_sign_in_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_manage_staff() then raise exception 'Only Management, the General Manager or an administrator can manage accounts'; end if;
  return query select p.user_id, u.email::text, p.full_name, p.title, p.role, p.person_key, p.is_admin, p.is_demo, u.last_sign_in_at, p.created_at
    from public.profiles p join auth.users u on u.id = p.user_id order by p.is_admin desc, p.is_demo, p.created_at;
end $$;

create or replace function public.admin_create_user(p_email text, p_password text, p_full_name text, p_role text, p_title text default '', p_person_key text default '', p_is_admin boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_manage_staff() then raise exception 'Only Management, the General Manager or an administrator can manage accounts'; end if;
  if coalesce(p_is_admin, false) and not public.is_admin() then raise exception 'Only an administrator can create administrators'; end if;
  if p_role = 'ceo' and not exists (select 1 from public.profiles where user_id = auth.uid() and (is_admin or role = 'ceo')) then
    raise exception 'Only Management or an administrator can create Management accounts';
  end if;
  return private.create_account(p_email, p_password, p_full_name, p_role, p_title, p_person_key, coalesce(p_is_admin, false), false);
end $$;

create or replace function public.admin_update_user(p_user uuid, p_full_name text, p_role text, p_title text, p_person_key text, p_is_admin boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare cur public.profiles;
begin
  if not public.can_manage_staff() or not private.may_manage(p_user) then raise exception 'You cannot change this account'; end if;
  if p_role not in ('ceo', 'gm', 'staff', 'finance', 'reception', 'store', 'production', 'clientservice', 'creative', 'operations', 'pa') then raise exception 'Unknown portal: %', p_role; end if;
  select * into cur from public.profiles where user_id = p_user;
  if coalesce(p_is_admin, false) <> coalesce(cur.is_admin, false) and not public.is_admin() then raise exception 'Only an administrator gives or removes administrator access'; end if;
  if p_role = 'ceo' and cur.role is distinct from 'ceo' and not exists (select 1 from public.profiles where user_id = auth.uid() and (is_admin or role = 'ceo')) then
    raise exception 'Only Management or an administrator can move someone into Management';
  end if;
  if p_user = auth.uid() and cur.is_admin and not p_is_admin then raise exception 'You cannot remove your own administrator access'; end if;
  update public.profiles set full_name = p_full_name, role = p_role, title = coalesce(p_title, ''), person_key = nullif(upper(trim(p_person_key)), ''), is_admin = coalesce(p_is_admin, false)
    where user_id = p_user;
end $$;

create or replace function public.admin_set_password(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_manage_staff() or not private.may_manage(p_user) then raise exception 'You cannot change this account'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_user;
end $$;

create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_manage_staff() or not private.may_manage(p_user) then raise exception 'You cannot delete this account'; end if;
  if p_user = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  delete from auth.users where id = p_user;
end $$;

revoke execute on function public.can_manage_staff() from public, anon;
grant execute on function public.can_manage_staff() to authenticated;
revoke execute on function public.admin_list_users(), public.admin_create_user(text, text, text, text, text, text, boolean), public.admin_update_user(uuid, text, text, text, text, boolean),
  public.admin_set_password(uuid, text), public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_list_users(), public.admin_create_user(text, text, text, text, text, text, boolean), public.admin_update_user(uuid, text, text, text, text, boolean),
  public.admin_set_password(uuid, text), public.admin_delete_user(uuid) to authenticated;
