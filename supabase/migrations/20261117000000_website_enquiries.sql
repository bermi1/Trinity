-- Trinity Mark 360 · enquiries sent from the public website (trinitymark.co.tz contact form).
-- Visitors can only send an enquiry; they cannot read, change or remove any. Signed-in staff
-- see them in CRM and turn them into leads. Safe to run again.

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  company text not null default '' check (char_length(company) <= 160),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text not null default '' check (char_length(phone) <= 40),
  service text not null default '' check (char_length(service) <= 80),
  event_date text not null default '' check (char_length(event_date) <= 40),
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  handled_by uuid,
  handled_at timestamptz
);
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
alter table public.enquiries enable row level security;

-- Visitors: send only, and only the form's own fields.
revoke all on public.enquiries from anon, authenticated;
grant insert (name, company, email, phone, service, event_date, message) on public.enquiries to anon, authenticated;
-- Staff: read, and record what was done with each enquiry.
grant select on public.enquiries to authenticated;
grant update (status, handled_by, handled_at) on public.enquiries to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Anyone can send an enquiry') then
    create policy "Anyone can send an enquiry" on public.enquiries for insert to anon, authenticated
      with check (status = 'new' and handled_by is null and handled_at is null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Staff read enquiries') then
    create policy "Staff read enquiries" on public.enquiries for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Staff update enquiries') then
    create policy "Staff update enquiries" on public.enquiries for update to authenticated using (true) with check (true);
  end if;
end $$;
