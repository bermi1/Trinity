-- SMS confirmation for event registrations (sent by the event-sms Edge Function through Textify Africa).
alter table public.event_registrations add column if not exists sms_status text not null default '';
alter table public.event_registrations add column if not exists sms_at timestamptz;
alter table public.event_registrations add column if not exists sms_error text not null default '';
-- Lets the database call the Edge Function (used to test it, and available for automatic sends later).
create extension if not exists pg_net with schema extensions;
