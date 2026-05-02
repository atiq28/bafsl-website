create table if not exists public.site_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_state enable row level security;

drop policy if exists "Public can read BAFSL state" on public.site_state;
create policy "Public can read BAFSL state"
on public.site_state
for select
to anon, authenticated
using (id = 'bafsl');

drop policy if exists "Authenticated admins can insert BAFSL state" on public.site_state;
create policy "Authenticated admins can insert BAFSL state"
on public.site_state
for insert
to authenticated
with check (id = 'bafsl');

drop policy if exists "Authenticated admins can update BAFSL state" on public.site_state;
create policy "Authenticated admins can update BAFSL state"
on public.site_state
for update
to authenticated
using (id = 'bafsl')
with check (id = 'bafsl');
