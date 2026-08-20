-- ================================================================
-- Vrindavan Ganpati Mandal Manager — Production Security Rules
-- Run this script in Supabase: SQL Editor → New Query → Run
-- ================================================================

-- 1. Enable Row Level Security (RLS) on all public tables
alter table public.donations enable row level security;
alter table public.expenses enable row level security;
alter table public.aartis enable row level security;
alter table public.events enable row level security;
alter table public.contacts enable row level security;

-- 2. Drop existing open policies
drop policy if exists "Shared mandal donations" on public.donations;
drop policy if exists "Shared mandal expenses" on public.expenses;
drop policy if exists "Shared mandal aartis" on public.aartis;
drop policy if exists "Shared mandal events" on public.events;
drop policy if exists "Shared mandal contacts" on public.contacts;

drop policy if exists "Public Read Donations" on public.donations;
drop policy if exists "Public Insert Donations" on public.donations;
drop policy if exists "Public Read Expenses" on public.expenses;
drop policy if exists "Public Insert Expenses" on public.expenses;
drop policy if exists "Public Read Aartis" on public.aartis;
drop policy if exists "Public Insert Aartis" on public.aartis;
drop policy if exists "Public Read Events" on public.events;
drop policy if exists "Public Insert Events" on public.events;
drop policy if exists "Public Read Contacts" on public.contacts;
drop policy if exists "Public Insert Contacts" on public.contacts;

-- 3. Create Public Read & Insert Policies (Allow mandal members to read & submit entries safely)
create policy "Public Read Donations" on public.donations for select to anon using (true);
create policy "Public Insert Donations" on public.donations for insert to anon with check (amount >= 0 and length(name) > 0);

create policy "Public Read Expenses" on public.expenses for select to anon using (true);
create policy "Public Insert Expenses" on public.expenses for insert to anon with check (amount >= 0 and length(description) > 0);

create policy "Public Read Aartis" on public.aartis for select to anon using (true);
create policy "Public Insert Aartis" on public.aartis for insert to anon with check (length(person) > 0);

create policy "Public Read Events" on public.events for select to anon using (true);
create policy "Public Insert Events" on public.events for insert to anon with check (length(title) > 0);

create policy "Public Read Contacts" on public.contacts for select to anon using (true);
create policy "Public Insert Contacts" on public.contacts for insert to anon with check (length(name) > 0);

-- 4. Secure Storage Buckets (Bill Photos)
insert into storage.buckets (id, name, public)
values ('mandal-bills', 'mandal-bills', true)
on conflict (id) do nothing;

drop policy if exists "Public Read Bill Images" on storage.objects;
drop policy if exists "Public Upload Bill Images" on storage.objects;

create policy "Public Read Bill Images" on storage.objects for select to anon using (bucket_id = 'mandal-bills');
create policy "Public Upload Bill Images" on storage.objects for insert to anon with check (bucket_id = 'mandal-bills');
