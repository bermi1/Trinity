-- Phone numbers match on their last 9 digits, so 0712…, 712… and +255 712… are one attendee.
drop index if exists public.event_registrations_phone;
create unique index if not exists event_registrations_phone9 on public.event_registrations (event_id, right(regexp_replace(phone, '\D', '', 'g'), 9));

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
