-- Server-only settings read by Edge Functions with the service role (the Textify SMS key and sender name).
-- Row level security on with no policies: the app, visitors and signed-in staff can never read it.
-- Values are entered directly in the database, never in this repository.
create table if not exists public.server_secrets (name text primary key, value text not null, updated_at timestamptz not null default now());
alter table public.server_secrets enable row level security;
revoke all on public.server_secrets from anon, authenticated;
