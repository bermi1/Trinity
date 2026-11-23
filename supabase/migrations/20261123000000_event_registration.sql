-- Event registration: attendees self-register by scanning a QR code (no account), or staff register
-- walk-ins at the desk. The public can only call register_attendee() and read the event's public
-- details; it can never read the list. Signed-in staff read, check in and export.

create table if not exists public.events (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  tagline text not null default '',
  event_date text not null default '',
  event_time text not null default '',
  venue text not null default '',
  message text not null default '',
  open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  badge_no integer not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 20),
  email text not null default '',
  organization text not null default '',
  position text not null default '',
  region text not null default '',
  district text not null default '',
  gender text not null default '',
  category text not null default '',
  mode text not null check (mode in ('qr', 'walkin')),
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  registered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, badge_no)
);
create unique index if not exists event_registrations_phone9 on public.event_registrations (event_id, right(regexp_replace(phone, '\D', '', 'g'), 9));

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists events_read on public.events;
create policy events_read on public.events for select using (true);
drop policy if exists events_staff_write on public.events;
create policy events_staff_write on public.events for update to authenticated using (true) with check (true);

drop policy if exists reg_staff_read on public.event_registrations;
create policy reg_staff_read on public.event_registrations for select to authenticated using (true);
drop policy if exists reg_staff_update on public.event_registrations;
create policy reg_staff_update on public.event_registrations for update to authenticated using (true) with check (true);

-- Registers one attendee. Anyone may self-register ('qr') while the event is open; walk-ins
-- ('walkin') need a signed-in staff member. A phone already registered returns that registration.
create or replace function public.register_attendee(
  p_event text, p_full_name text, p_phone text, p_email text default '', p_organization text default '',
  p_position text default '', p_region text default '', p_district text default '', p_gender text default '',
  p_category text default '', p_mode text default 'qr'
) returns json
language plpgsql security definer set search_path = '' as $$
declare
  ev public.events%rowtype; r public.event_registrations%rowtype; n integer; digits text;
begin
  select * into ev from public.events where id = p_event;
  if not found then raise exception 'Event not found'; end if;
  if p_mode = 'walkin' and auth.uid() is null then raise exception 'Sign in to register walk-ins'; end if;
  if p_mode not in ('qr', 'walkin') then raise exception 'Unknown registration type'; end if;
  if not ev.open and p_mode = 'qr' then raise exception 'Registration is closed'; end if;
  if char_length(trim(coalesce(p_full_name, ''))) < 2 then raise exception 'Enter your full name'; end if;
  digits := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
  if char_length(digits) < 9 then raise exception 'Enter a valid phone number'; end if;
  -- The same number written as 07…, 7… or +255 7… is the same person (matched on its last 9 digits).
  perform pg_advisory_xact_lock(hashtext('event_reg_' || p_event));
  select * into r from public.event_registrations where event_id = p_event and right(regexp_replace(phone, '\D', '', 'g'), 9) = digits;
  if found then
    return json_build_object('id', r.id, 'badge_no', r.badge_no, 'full_name', r.full_name, 'existing', true);
  end if;
  select coalesce(max(badge_no), 0) + 1 into n from public.event_registrations where event_id = p_event;
  insert into public.event_registrations (event_id, badge_no, full_name, phone, email, organization, position, region, district, gender, category, mode, registered_by, checked_in, checked_in_at)
  values (p_event, n, trim(p_full_name), trim(p_phone), trim(coalesce(p_email, '')), trim(coalesce(p_organization, '')), trim(coalesce(p_position, '')),
          trim(coalesce(p_region, '')), trim(coalesce(p_district, '')), coalesce(p_gender, ''), coalesce(p_category, ''), p_mode, auth.uid(),
          p_mode = 'walkin', case when p_mode = 'walkin' then now() end)
  returning * into r;
  return json_build_object('id', r.id, 'badge_no', r.badge_no, 'full_name', r.full_name, 'existing', false);
end $$;

revoke all on function public.register_attendee(text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.register_attendee(text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
grant select on public.events to anon, authenticated;
grant update on public.events to authenticated;
grant select, update on public.event_registrations to authenticated;

insert into public.events (id, title, subtitle, tagline, event_date, event_time, venue, message, open)
values ('nishati-2026', 'Mpango wa Nishati wa Taifa',
        'Kikao cha Tathmini ya Utekelezaji wa Mpango wa Kuharakisha Uanganishaji wa Umeme kwa Kaya',
        'Kila Kaya Itwaka', '', '', '',
        'Asante kwa kujisajili. Tunakukaribisha kuhudhuria kikao hiki muhimu. Tafadhali fika mapema na uonyeshe namba yako ya usajili mezani.', true)
on conflict (id) do nothing;
