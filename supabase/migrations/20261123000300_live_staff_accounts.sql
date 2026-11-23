-- Trinity Mark 360 · going live with the real team (23 Nov 2026).
-- 1. Keeps a full copy of the shared records, then removes the demo and test records: only the staff list stays.
-- 2. Adds the General Manager (Godfrey Maximillian) and the Boss (Thadeo).
-- 3. Every account signs in as firstname@trinitymark.co.tz with the first name (lower case) as its first password,
--    and is asked to choose a new password straight after (the pw_set flag is cleared).
-- 4. Lets a signed-in person change their own sign-in email.

create schema if not exists private;
create table if not exists private.app_records_backup_20261123 as select * from public.app_records;

delete from public.app_records where collection not in ('staff', '_meta');

alter table public.profiles add column if not exists phone text not null default '';

do $$
begin
  if not exists (select 1 from public.profiles where person_key = 'GOM') then
    perform private.create_account('godfrey@trinitymark.co.tz', 'Temporary-Password-1', 'Godfrey Maximillian', 'gm', 'General Manager', 'GOM', false, false);
  end if;
  if not exists (select 1 from public.profiles where person_key = 'TH') then
    perform private.create_account('thadeo@trinitymark.co.tz', 'Temporary-Password-1', 'Thadeo', 'ceo', 'Managing Director', 'TH', false, false);
  end if;
end $$;
update public.profiles set phone = '065880714' where person_key = 'GOM';

-- firstname@trinitymark.co.tz and the first-name password, for everyone except the administrator account.
with p as (
  select user_id, lower(regexp_replace(split_part(trim(full_name), ' ', 1), '[^A-Za-z]', '', 'g')) as first
  from public.profiles where not is_admin
)
update auth.users u
   set email = p.first || '@trinitymark.co.tz',
       encrypted_password = extensions.crypt(p.first, extensions.gen_salt('bf')),
       raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'pw_set',
       email_confirmed_at = coalesce(u.email_confirmed_at, now()),
       updated_at = now()
  from p where u.id = p.user_id;
update auth.identities i set identity_data = i.identity_data || jsonb_build_object('email', u.email), updated_at = now()
  from auth.users u where u.id = i.user_id and i.provider = 'email';

-- A signed-in person may change their own sign-in email (no confirmation email: the office has no mail server yet).
create or replace function public.change_my_email(p_email text)
returns text language plpgsql security definer set search_path = '' as $$
declare em text := lower(trim(coalesce(p_email, '')));
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address'; end if;
  if exists (select 1 from auth.users where email = em and id <> auth.uid()) then raise exception 'That email is already used by another account'; end if;
  update auth.users set email = em, email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = auth.uid();
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', em), updated_at = now() where user_id = auth.uid() and provider = 'email';
  return em;
end $$;
revoke all on function public.change_my_email(text) from public, anon;
grant execute on function public.change_my_email(text) to authenticated;
