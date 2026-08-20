-- Shree Ganesh Mandal Manager — Supabase setup
-- Run this entire file in Supabase: SQL Editor → New query → Run.

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  date date not null default current_date,
  mode text not null check (mode in ('Cash', 'UPI', 'Bank Transfer', 'Other')),
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Decoration', 'Prasad', 'Sound System', 'Pooja Material', 'Electricity', 'Transport', 'Other')),
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  paid_by text not null,
  date date not null default current_date,
  image_url text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.aartis (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null check (type in ('Morning', 'Evening')),
  person text not null,
  time time not null,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null,
  description text not null,
  image_url text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- This app deliberately has no individual logins. These policies let a browser
-- with the public anon key use the shared mandal data. Protect the deployed URL.
alter table public.donations enable row level security;
alter table public.expenses enable row level security;
alter table public.aartis enable row level security;
alter table public.events enable row level security;
alter table public.contacts enable row level security;

drop policy if exists "Shared mandal donations" on public.donations;
drop policy if exists "Shared mandal expenses" on public.expenses;
drop policy if exists "Shared mandal aartis" on public.aartis;
drop policy if exists "Shared mandal events" on public.events;
drop policy if exists "Shared mandal contacts" on public.contacts;
create policy "Shared mandal donations" on public.donations for all to anon using (true) with check (true);
create policy "Shared mandal expenses" on public.expenses for all to anon using (true) with check (true);
create policy "Shared mandal aartis" on public.aartis for all to anon using (true) with check (true);
create policy "Shared mandal events" on public.events for all to anon using (true) with check (true);
create policy "Shared mandal contacts" on public.contacts for all to anon using (true) with check (true);

grant usage on schema public to anon;
grant all on public.donations, public.expenses, public.aartis, public.events, public.contacts to anon;

-- Enable real-time changes for every screen. Safe to run more than once.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'donations') then alter publication supabase_realtime add table public.donations; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expenses') then alter publication supabase_realtime add table public.expenses; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'aartis') then alter publication supabase_realtime add table public.aartis; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events') then alter publication supabase_realtime add table public.events; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contacts') then alter publication supabase_realtime add table public.contacts; end if;
end $$;

-- Public image buckets for optional bill and announcement pictures.
insert into storage.buckets (id, name, public)
values ('mandal-bills', 'mandal-bills', true), ('mandal-announcements', 'mandal-announcements', true)
on conflict (id) do nothing;

drop policy if exists "Shared bill images" on storage.objects;
drop policy if exists "Shared announcement images" on storage.objects;
create policy "Shared bill images" on storage.objects for all to anon using (bucket_id = 'mandal-bills') with check (bucket_id = 'mandal-bills');
create policy "Shared announcement images" on storage.objects for all to anon using (bucket_id = 'mandal-announcements') with check (bucket_id = 'mandal-announcements');
