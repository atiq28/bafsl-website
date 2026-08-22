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

create table if not exists public.amateur_predictions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 160),
  picks jsonb not null,
  submitted_at timestamptz not null default now()
);

create unique index if not exists amateur_predictions_email_unique
on public.amateur_predictions (lower(btrim(email)));

create unique index if not exists amateur_predictions_name_unique
on public.amateur_predictions (lower(btrim(name)));

create table if not exists public.amateur_results (
  id text primary key default 'official',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.amateur_match_results (
  match_id integer primary key check (match_id between 1 and 8),
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
  events jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Earlier installations limited this table to the five group-stage games.
-- Replace that constraint so semi-final and final results can also persist.
alter table public.amateur_match_results
drop constraint if exists amateur_match_results_match_id_check;

alter table public.amateur_match_results
add constraint amateur_match_results_match_id_check
check (match_id between 1 and 8);

alter table public.amateur_predictions enable row level security;
alter table public.amateur_results enable row level security;
alter table public.amateur_match_results enable row level security;

drop policy if exists "Public can read Amateur match results" on public.amateur_match_results;
create policy "Public can read Amateur match results"
on public.amateur_match_results for select to anon, authenticated using (true);

drop policy if exists "Admins can manage Amateur match results" on public.amateur_match_results;
create policy "Admins can manage Amateur match results"
on public.amateur_match_results for all to authenticated using (true) with check (true);

drop policy if exists "Admins can read Amateur predictions" on public.amateur_predictions;
create policy "Admins can read Amateur predictions"
on public.amateur_predictions
for select
to authenticated
using (true);

drop policy if exists "Admins can delete Amateur predictions" on public.amateur_predictions;
create policy "Admins can delete Amateur predictions"
on public.amateur_predictions
for delete
to authenticated
using (true);

drop policy if exists "Public can read Amateur results" on public.amateur_results;
create policy "Public can read Amateur results"
on public.amateur_results
for select
to anon, authenticated
using (id = 'official');

drop policy if exists "Admins can manage Amateur results" on public.amateur_results;
create policy "Admins can manage Amateur results"
on public.amateur_results
for all
to authenticated
using (id = 'official')
with check (id = 'official');

create or replace function public.submit_amateur_prediction(
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
  raise exception 'Amateur challenge entries are closed.';

  if char_length(trim(participant_name)) not between 1 and 80 then
    raise exception 'Please provide a valid name.';
  end if;

  if participant_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Please provide a valid email address.';
  end if;

  if exists (
    select 1 from public.amateur_predictions
    where lower(btrim(name)) = lower(btrim(participant_name))
  ) then
    raise exception 'That name has already been used.';
  end if;

  if exists (
    select 1 from public.amateur_predictions
    where lower(btrim(email)) = lower(btrim(participant_email))
  ) then
    raise exception 'That email address has already been used.';
  end if;

  insert into public.amateur_predictions (name, email, picks)
  values (trim(participant_name), lower(trim(participant_email)), participant_picks)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.submit_amateur_prediction(text, text, jsonb) from public;
grant execute on function public.submit_amateur_prediction(text, text, jsonb) to anon, authenticated;

create or replace function public.amateur_score_value(record jsonb, match_id integer, side text)
returns integer
language sql
immutable
as $$
  select case
    when record #>> array['scores', match_id::text, side] ~ '^[0-9]+$'
    then (record #>> array['scores', match_id::text, side])::integer
    else null
  end;
$$;

create or replace function public.amateur_rank_team(record jsonb, rank_index integer)
returns text
language sql
immutable
as $$
  select record #>> array['groupRanking', rank_index::text];
$$;

create or replace function public.amateur_match_side(record jsonb, match_id integer, side text)
returns text
language plpgsql
immutable
as $$
begin
  return case
    when match_id = 1 and side = 'home' then 'nandonik'
    when match_id = 1 and side = 'away' then 'ekattor'
    when match_id = 2 and side = 'home' then 'joddha'
    when match_id = 2 and side = 'away' then 'sonar-bangla'
    when match_id = 3 and side = 'home' then 'ekattor'
    when match_id = 3 and side = 'away' then 'joddha'
    when match_id = 4 and side = 'home' then 'sonar-bangla'
    when match_id = 4 and side = 'away' then 'dhumketu'
    when match_id = 5 and side = 'home' then 'dhumketu'
    when match_id = 5 and side = 'away' then 'nandonik'
    when match_id = 6 and side = 'home' then public.amateur_rank_team(record, 0)
    when match_id = 6 and side = 'away' then public.amateur_rank_team(record, 3)
    when match_id = 7 and side = 'home' then public.amateur_rank_team(record, 1)
    when match_id = 7 and side = 'away' then public.amateur_rank_team(record, 2)
    else null
  end;
end;
$$;

create or replace function public.amateur_match_winner(record jsonb, match_id integer)
returns text
language plpgsql
immutable
as $$
declare
  home_team text;
  away_team text;
  home_score integer;
  away_score integer;
begin
  if match_id = 8 then
    home_team := public.amateur_match_winner(record, 6);
    away_team := public.amateur_match_winner(record, 7);
  else
    home_team := public.amateur_match_side(record, match_id, 'home');
    away_team := public.amateur_match_side(record, match_id, 'away');
  end if;

  home_score := public.amateur_score_value(record, match_id, 'home');
  away_score := public.amateur_score_value(record, match_id, 'away');

  if home_team is null or away_team is null or home_score is null or away_score is null or home_score = away_score then
    return null;
  end if;

  if home_score > away_score then
    return home_team;
  end if;
  return away_team;
end;
$$;

create or replace function public.amateur_prediction_score(prediction jsonb)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actual jsonb;
  total integer := 0;
  match_id integer;
  ph integer;
  pa integer;
  ah integer;
  aa integer;
  rank_index integer;
  predicted_finalists text[];
  actual_finalists text[];
  predicted_champion text;
  actual_champion text;
  predicted_goals integer;
  actual_goals integer;
begin
  select data into actual
  from public.amateur_results
  where id = 'official';

  if actual is null then
    return 0;
  end if;

  for match_id in 1..8 loop
    ph := public.amateur_score_value(prediction, match_id, 'home');
    pa := public.amateur_score_value(prediction, match_id, 'away');
    ah := public.amateur_score_value(actual, match_id, 'home');
    aa := public.amateur_score_value(actual, match_id, 'away');

    if ph is not null and pa is not null and ah is not null and aa is not null then
      if (ph > pa and ah > aa) or (ph < pa and ah < aa) or (ph = pa and ah = aa) then
        total := total + 3;
      end if;
      if ph - pa = ah - aa then
        total := total + 2;
      end if;
      if ph = ah and pa = aa then
        total := total + 5;
      end if;
    end if;
  end loop;

  for rank_index in 0..4 loop
    if public.amateur_rank_team(prediction, rank_index) is not null
      and public.amateur_rank_team(prediction, rank_index) = public.amateur_rank_team(actual, rank_index) then
      total := total + 5;
    end if;
  end loop;

  predicted_finalists := array[
    public.amateur_match_winner(prediction, 6),
    public.amateur_match_winner(prediction, 7)
  ];
  actual_finalists := array[
    public.amateur_match_winner(actual, 6),
    public.amateur_match_winner(actual, 7)
  ];

  if predicted_finalists[1] is not null and predicted_finalists[1] = any(actual_finalists) then
    total := total + 8;
  end if;
  if predicted_finalists[2] is not null and predicted_finalists[2] = any(actual_finalists) then
    total := total + 8;
  end if;

  predicted_champion := public.amateur_match_winner(prediction, 8);
  actual_champion := public.amateur_match_winner(actual, 8);
  if predicted_champion is not null and predicted_champion = actual_champion then
    total := total + 15;
  end if;

  if lower(btrim(coalesce(prediction ->> 'topScorer', ''))) <> ''
    and lower(btrim(prediction ->> 'topScorer')) = lower(btrim(actual ->> 'topScorer')) then
    total := total + 8;
  end if;

  if coalesce(prediction ->> 'highestScoringTeam', '') <> ''
    and prediction ->> 'highestScoringTeam' = actual ->> 'highestScoringTeam' then
    total := total + 6;
  end if;

  if prediction ->> 'totalGoals' ~ '^[0-9]+$' and actual ->> 'totalGoals' ~ '^[0-9]+$' then
    predicted_goals := (prediction ->> 'totalGoals')::integer;
    actual_goals := (actual ->> 'totalGoals')::integer;
    if predicted_goals = actual_goals then
      total := total + 6;
    elsif abs(predicted_goals - actual_goals) <= 2 then
      total := total + 3;
    end if;
  end if;

  return total;
end;
$$;

create or replace view public.amateur_leaderboard
with (security_invoker = false)
as
select
  p.id,
  p.name,
  public.amateur_prediction_score(p.picks) as score,
  p.submitted_at
from public.amateur_predictions p
order by score desc, submitted_at asc;

revoke all on public.amateur_leaderboard from public;
grant select on public.amateur_leaderboard to anon, authenticated;
