-- Program Managers
create table if not exists public.program_managers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null unique,
  full_name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.program_managers enable row level security;

drop policy if exists "Admins manage program managers" on public.program_managers;
create policy "Admins manage program managers" on public.program_managers
  for all using (public.is_admin()) with check (public.is_admin());

-- Assign Program Manager to Tournament (many-to-one)
create table if not exists public.tournament_program_managers (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  program_manager_id uuid not null references public.program_managers(id) on delete cascade,
  primary key (tournament_id)
);

alter table public.tournament_program_managers enable row level security;
drop policy if exists "Admins manage tpm" on public.tournament_program_managers;
create policy "Admins manage tpm" on public.tournament_program_managers
  for all using (public.is_admin()) with check (public.is_admin());

-- Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  match_number int,
  round int,
  pool int,
  team1_id uuid references public.teams(id) on delete set null,
  team2_id uuid references public.teams(id) on delete set null,
  scheduled_date date,
  scheduled_time text,
  field text,
  duration int default 75,
  status text default 'scheduled' check (status in ('scheduled','in-progress','completed','cancelled')),
  score1 int,
  score2 int,
  updated_at timestamptz default now()
);

create index if not exists idx_matches_tournament on public.matches(tournament_id);
create index if not exists idx_matches_status on public.matches(status);

alter table public.matches enable row level security;

-- Admins full access
drop policy if exists "Admins manage matches" on public.matches;
create policy "Admins manage matches" on public.matches
  for all using (public.is_admin()) with check (public.is_admin());

-- Program Managers can manage matches for their tournaments
drop policy if exists "PM manage their tournament matches" on public.matches;
create policy "PM manage their tournament matches" on public.matches
  for all using (
    exists (
      select 1 from public.program_managers pm
      join public.tournament_program_managers tpm on tpm.program_manager_id = pm.id
      where pm.auth_user_id = auth.uid() and tpm.tournament_id = matches.tournament_id
    )
  ) with check (
    exists (
      select 1 from public.program_managers pm
      join public.tournament_program_managers tpm on tpm.program_manager_id = pm.id
      where pm.auth_user_id = auth.uid() and tpm.tournament_id = matches.tournament_id
    )
  );

-- Registration Forms (player form per tournament)
create table if not exists public.registration_forms (
  tournament_id uuid primary key references public.tournaments(id) on delete cascade,
  player_fields jsonb not null default '[]'::jsonb,
  team_fields jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.registration_forms enable row level security;

drop policy if exists "Admins manage registration_forms" on public.registration_forms;
create policy "Admins manage registration_forms" on public.registration_forms
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================
-- Coach Home Visits & Player Extra Details
-- ============================================

-- Store additional profile fields captured by coaches (address, etc)
create table if not exists public.player_extra (
  player_id uuid primary key references public.players(id) on delete cascade,
  address text,
  other_info jsonb not null default '{}'::jsonb,
  updated_by uuid, -- coach id
  updated_at timestamptz default now()
);

alter table public.player_extra enable row level security;

drop policy if exists "Admins manage player_extra" on public.player_extra;
create policy "Admins manage player_extra" on public.player_extra
  for all using (public.is_admin()) with check (public.is_admin());

-- Allow coaches to manage player_extra
drop policy if exists "Coaches manage player_extra" on public.player_extra;
create policy "Coaches manage player_extra" on public.player_extra
  for all using (
    exists (select 1 from public.coaches c where c.auth_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.coaches c where c.auth_user_id = auth.uid())
  );

-- Home visit logs
create table if not exists public.home_visits (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete set null,
  visit_date date not null,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_home_visits_player on public.home_visits(player_id);
alter table public.home_visits enable row level security;

drop policy if exists "Admins manage home_visits" on public.home_visits;
create policy "Admins manage home_visits" on public.home_visits
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Coaches manage home_visits" on public.home_visits;
create policy "Coaches manage home_visits" on public.home_visits
  for all using (
    exists (select 1 from public.coaches c where c.auth_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.coaches c where c.auth_user_id = auth.uid())
  );


