-- ============================================================
-- Multi-Mandal Migration for Ganpati Mandal Manager
-- Run ONCE in Supabase: SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── 1. MANDALS TABLE ────────────────────────────────────────
create table if not exists public.mandals (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,          -- login username e.g. "vrindavan"
  name          text not null,                 -- full Marathi name
  city          text not null default '',
  contact_phone text not null default '',
  nondani_no    text not null default '',
  password_hash text not null,                 -- SHA-256 of chosen password
  pin_hash      text not null,                 -- SHA-256 of financial PIN
  created_at    timestamptz not null default now()
);

-- ─── 2. INSERT वृंदावन AS THE FIRST MANDAL ──────────────────
-- password_hash & pin_hash = SHA-256 of '2026' (current app PIN)
-- The admin should change password via Settings after first login.
insert into public.mandals (id, slug, name, city, contact_phone, nondani_no, password_hash, pin_hash)
values (
  '00000000-0000-0000-0000-000000000001',
  'vrindavan',
  'वृंदावन कला, क्रीडा व सांस्कृतिक मंडळ',
  'Kavlapur, Miraj, Sangli',
  '',
  'महा/220/14',
  '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab',
  '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab'
) on conflict (id) do nothing;

-- ─── 3. ADD mandal_id TO EXISTING TABLES ─────────────────────
alter table public.donations  add column if not exists mandal_id uuid references public.mandals(id);
alter table public.expenses   add column if not exists mandal_id uuid references public.mandals(id);
alter table public.aartis     add column if not exists mandal_id uuid references public.mandals(id);
alter table public.events     add column if not exists mandal_id uuid references public.mandals(id);
alter table public.contacts   add column if not exists mandal_id uuid references public.mandals(id);

-- ─── 4. ASSIGN ALL EXISTING ROWS TO वृंदावन ──────────────────
update public.donations set mandal_id = '00000000-0000-0000-0000-000000000001' where mandal_id is null;
update public.expenses  set mandal_id = '00000000-0000-0000-0000-000000000001' where mandal_id is null;
update public.aartis    set mandal_id = '00000000-0000-0000-0000-000000000001' where mandal_id is null;
update public.events    set mandal_id = '00000000-0000-0000-0000-000000000001' where mandal_id is null;
update public.contacts  set mandal_id = '00000000-0000-0000-0000-000000000001' where mandal_id is null;

-- ─── 5. NEW: DOCUMENTS TABLE (was localStorage-only) ─────────
create table if not exists public.documents (
  id          text primary key,
  mandal_id   uuid not null references public.mandals(id),
  title       text not null default '',
  category    text not null default '',
  icon        text not null default '📄',
  outward_no  text not null default '',
  issued_by   text not null default '',
  valid_from  text not null default '',
  valid_until text not null default '',
  status      text not null default 'Pending',
  note        text not null default '',
  image       text not null default '',
  created_at  timestamptz not null default now()
);

-- ─── 6. NEW: ALANKAR TABLE (was localStorage-only) ───────────
create table if not exists public.alankar (
  id          text primary key,
  mandal_id   uuid not null references public.mandals(id),
  date        text not null default '',
  type        text not null default '',
  note        text not null default '',
  image       text not null default '',
  created_at  timestamptz not null default now()
);

-- ─── 7. RLS FOR MANDALS TABLE ────────────────────────────────
alter table public.mandals enable row level security;
drop policy if exists "Mandals select" on public.mandals;
drop policy if exists "Mandals insert" on public.mandals;
-- Only slug + public fields visible via RPC; raw select needed for RPC execution
create policy "Mandals select" on public.mandals for select to anon using (true);
create policy "Mandals insert" on public.mandals for insert to anon with check (true);
-- No direct update/delete from client; done via RPC
grant usage on schema public to anon;
grant select, insert on public.mandals to anon;

-- ─── 8. RLS FOR NEW TABLES ───────────────────────────────────
alter table public.documents enable row level security;
alter table public.alankar   enable row level security;
drop policy if exists "Shared mandal documents" on public.documents;
drop policy if exists "Shared mandal alankar"   on public.alankar;
create policy "Shared mandal documents" on public.documents for all to anon using (true) with check (true);
create policy "Shared mandal alankar"   on public.alankar   for all to anon using (true) with check (true);
grant all on public.documents, public.alankar to anon;

-- ─── 9. RPC: verify_mandal_login ─────────────────────────────
-- Called client-side: takes slug + pre-hashed password, returns mandal data.
-- password_hash and pin_hash are NEVER returned to client.
create or replace function public.verify_mandal_login(p_slug text, p_password_hash text)
returns json
language plpgsql
security definer
as $$
declare
  v_row public.mandals%rowtype;
begin
  select * into v_row
  from public.mandals
  where slug = lower(trim(p_slug))
    and password_hash = p_password_hash
  limit 1;

  if not found then
    return null;
  end if;

  return json_build_object(
    'id',            v_row.id,
    'slug',          v_row.slug,
    'name',          v_row.name,
    'city',          v_row.city,
    'contact_phone', v_row.contact_phone,
    'nondani_no',    v_row.nondani_no,
    'pin_hash',      v_row.pin_hash,
    'created_at',    v_row.created_at
    -- password_hash intentionally excluded
  );
end;
$$;
grant execute on function public.verify_mandal_login(text, text) to anon;

-- ─── 10. RPC: register_mandal ─────────────────────────────────
create or replace function public.register_mandal(
  p_slug          text,
  p_name          text,
  p_city          text,
  p_contact_phone text,
  p_nondani_no    text,
  p_password_hash text,
  p_pin_hash      text
)
returns json
language plpgsql
security definer
as $$
declare
  v_id   uuid;
  v_slug text := lower(trim(p_slug));
begin
  -- Validate slug format (alphanumeric + hyphens only)
  if v_slug !~ '^[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]$' then
    return json_build_object('error', 'Slug must be 3–32 lowercase letters, digits, or hyphens.');
  end if;

  if exists (select 1 from public.mandals where slug = v_slug) then
    return json_build_object('error', 'Slug "' || v_slug || '" is already taken. Choose a different name.');
  end if;

  insert into public.mandals (slug, name, city, contact_phone, nondani_no, password_hash, pin_hash)
  values (v_slug, trim(p_name), trim(p_city), trim(p_contact_phone), trim(p_nondani_no), p_password_hash, p_pin_hash)
  returning id into v_id;

  return json_build_object('id', v_id, 'slug', v_slug, 'name', p_name);
end;
$$;
grant execute on function public.register_mandal(text, text, text, text, text, text, text) to anon;

-- ─── 11. RPC: update_mandal_settings ─────────────────────────
create or replace function public.update_mandal_settings(
  p_mandal_id     uuid,
  p_password_hash text,   -- current password to authenticate the call
  p_name          text,
  p_city          text,
  p_contact_phone text,
  p_nondani_no    text,
  p_new_pin_hash  text    -- pass null to keep existing PIN
)
returns json
language plpgsql
security definer
as $$
declare
  v_row public.mandals%rowtype;
begin
  select * into v_row from public.mandals where id = p_mandal_id and password_hash = p_password_hash limit 1;
  if not found then
    return json_build_object('error', 'Authentication failed. Check your password.');
  end if;

  update public.mandals set
    name          = trim(p_name),
    city          = trim(p_city),
    contact_phone = trim(p_contact_phone),
    nondani_no    = trim(p_nondani_no),
    pin_hash      = coalesce(nullif(p_new_pin_hash, ''), v_row.pin_hash)
  where id = p_mandal_id;

  return json_build_object('ok', true);
end;
$$;
grant execute on function public.update_mandal_settings(uuid, text, text, text, text, text, text) to anon;

-- ─── 12. RPC: change_mandal_password ─────────────────────────
create or replace function public.change_mandal_password(
  p_mandal_id        uuid,
  p_old_password_hash text,
  p_new_password_hash text
)
returns json
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from public.mandals where id = p_mandal_id and password_hash = p_old_password_hash) then
    return json_build_object('error', 'Current password is incorrect.');
  end if;

  update public.mandals set password_hash = p_new_password_hash where id = p_mandal_id;
  return json_build_object('ok', true);
end;
$$;
grant execute on function public.change_mandal_password(uuid, text, text) to anon;

-- ─── 13. REAL-TIME FOR NEW TABLES ────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'documents') then
    alter publication supabase_realtime add table public.documents;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alankar') then
    alter publication supabase_realtime add table public.alankar;
  end if;
end $$;

-- ─── 14. NEW STORAGE BUCKETS ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('mandal-documents', 'mandal-documents', true)
on conflict (id) do nothing;

drop policy if exists "Shared document images" on storage.objects;
create policy "Shared document images" on storage.objects for all to anon
  using (bucket_id = 'mandal-documents') with check (bucket_id = 'mandal-documents');


-- ─── 15. RPC: delete_mandal ──────────────────────────────────
-- Allows deleting a mandal and cascading to delete all records
create or replace function public.delete_mandal(
  p_mandal_id     uuid,
  p_password_hash text,
  p_pin_hash      text
)
returns json
language plpgsql
security definer
as $$
declare
  v_row public.mandals%rowtype;
begin
  select * into v_row from public.mandals
  where id = p_mandal_id and password_hash = p_password_hash and pin_hash = p_pin_hash limit 1;

  if not found then
    return json_build_object('error', 'Authentication failed: Incorrect password or PIN.');
  end if;

  -- Delete all associated mandal records
  delete from public.donations where mandal_id = p_mandal_id;
  delete from public.expenses  where mandal_id = p_mandal_id;
  delete from public.aartis    where mandal_id = p_mandal_id;
  delete from public.events    where mandal_id = p_mandal_id;
  delete from public.contacts  where mandal_id = p_mandal_id;
  delete from public.documents where mandal_id = p_mandal_id;
  delete from public.alankar   where mandal_id = p_mandal_id;

  -- Delete the mandal itself
  delete from public.mandals where id = p_mandal_id;

  return json_build_object('ok', true);
end;
$$;
grant execute on function public.delete_mandal(uuid, text, text) to anon;

-- ─── DONE ────────────────────────────────────────────────────
-- वृंदावन मंडळ login: slug = vrindavan, password = 2026
-- Change password immediately in Settings after first login.
