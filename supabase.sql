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

create extension if not exists pgcrypto;

create table if not exists public.world_cup_predictions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 160),
  picks jsonb not null,
  submitted_at timestamptz not null default now()
);

drop index if exists public.world_cup_predictions_email_unique;
create unique index world_cup_predictions_email_unique
on public.world_cup_predictions (lower(btrim(email)));

create unique index if not exists world_cup_predictions_name_unique
on public.world_cup_predictions (lower(btrim(name)));

create table if not exists public.world_cup_results (
  stage text not null,
  team text not null,
  updated_at timestamptz not null default now(),
  primary key (stage, team)
);

alter table public.world_cup_predictions enable row level security;
alter table public.world_cup_results enable row level security;

drop policy if exists "Admins can read World Cup predictions" on public.world_cup_predictions;
create policy "Admins can read World Cup predictions"
on public.world_cup_predictions
for select
to authenticated
using (true);

drop policy if exists "Admins can delete World Cup predictions" on public.world_cup_predictions;
create policy "Admins can delete World Cup predictions"
on public.world_cup_predictions
for delete
to authenticated
using (true);

drop policy if exists "Public can read World Cup results" on public.world_cup_results;
create policy "Public can read World Cup results"
on public.world_cup_results
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage World Cup results" on public.world_cup_results;
create policy "Admins can manage World Cup results"
on public.world_cup_results
for all
to authenticated
using (true)
with check (true);

create or replace function public.submit_world_cup_prediction(
  participant_name text,
  participant_email text,
  participant_picks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if now() >= timestamptz '2026-06-11 00:00:00-07' then
    raise exception 'World Cup bracket entries are closed.';
  end if;

  if char_length(trim(participant_name)) not between 1 and 80 then
    raise exception 'Please provide a valid name.';
  end if;

  if participant_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Please provide a valid email address.';
  end if;

  if exists (
    select 1 from public.world_cup_predictions
    where lower(btrim(name)) = lower(btrim(participant_name))
  ) then
    raise exception 'That name has already been used.';
  end if;

  if exists (
    select 1 from public.world_cup_predictions
    where lower(btrim(email)) = lower(btrim(participant_email))
  ) then
    raise exception 'That email address has already been used.';
  end if;

  insert into public.world_cup_predictions (name, email, picks)
  values (trim(participant_name), lower(trim(participant_email)), participant_picks)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.submit_world_cup_prediction(text, text, jsonb) from public;
grant execute on function public.submit_world_cup_prediction(text, text, jsonb) to anon, authenticated;

create or replace function public.world_cup_prediction_score(prediction jsonb)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(
    case r.stage
      when 'group_winners' then 2
      when 'group_runners_up' then 1
      when 'best_thirds' then 1
      when 'round_of_16' then 2
      when 'quarterfinals' then 4
      when 'semifinals' then 8
      when 'finalists' then 16
      when 'champion' then 32
      else 0
    end
  ), 0)::integer
  from public.world_cup_results r
  where prediction -> r.stage ? r.team;
$$;

create or replace view public.world_cup_leaderboard
with (security_invoker = false)
as
select
  p.id,
  p.name,
  public.world_cup_prediction_score(p.picks) as score,
  p.submitted_at
from public.world_cup_predictions p
order by score desc, submitted_at asc;

revoke all on public.world_cup_leaderboard from public;
grant select on public.world_cup_leaderboard to anon, authenticated;
