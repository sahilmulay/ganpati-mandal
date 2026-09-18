-- ================================================================
-- PHASE 1: SUPABASE STORAGE MIGRATION PREPARATION
-- Safe, non-destructive, idempotent migration script.
-- Run ONCE in Supabase: Dashboard → SQL Editor → New query → Run
-- ================================================================

-- ─── 1. EXTEND ALANKAR TABLE SCHEMA ─────────────────────────────
-- Adds nullable columns for Storage URLs, paths, and migration tracking.
-- Note: 'image' column is untouched and remains the active source of truth.
ALTER TABLE public.alankar ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.alankar ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.alankar ADD COLUMN IF NOT EXISTS storage_migrated boolean DEFAULT false;
ALTER TABLE public.alankar ADD COLUMN IF NOT EXISTS mime_type text;

-- ─── 2. CREATE STORAGE BUCKETS ──────────────────────────────────
-- alankar-images: 10MB limit for photos (JPEG, PNG, WebP, GIF)
-- alankar-videos: 50MB limit for videos (MP4, WebM, QuickTime)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('alankar-images', 'alankar-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('alankar-videos', 'alankar-videos', true, 52428800, ARRAY['video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 3. STORAGE SECURITY POLICIES (HARDENED RLS) ────────────────
-- Ganpati Mandal uses an application-level multi-tenant authentication
-- model where clients connect via the publishable/anon key.
--
-- Security hardening:
-- 1. Read: Public SELECT on both buckets so visitors can view media.
-- 2. Write: Strict INSERT restrictions requiring:
--    a) split_part(name, '/', 1) must match an existing mandal in public.mandals (slug or id)
--    b) split_part(name, '/', 2) must match 'photos'/'images' (for images) or 'videos' (for videos)
--    c) File extension must match allowed media types (.jpg, .png, .mp4, etc.)
--    d) Bucket engine enforces file size limits (10MB / 50MB) and MIME types.
-- 3. Immutability: NO UPDATE or DELETE policies are granted to anon, preventing tampering.
DO $$
BEGIN
  -- Drop existing / legacy policies if any
  DROP POLICY IF EXISTS "Public Access alankar-images" ON storage.objects;
  DROP POLICY IF EXISTS "Public Access alankar-videos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Uploads alankar-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Uploads alankar-videos" ON storage.objects;
  DROP POLICY IF EXISTS "Public Read alankar-images" ON storage.objects;
  DROP POLICY IF EXISTS "Public Read alankar-videos" ON storage.objects;
  DROP POLICY IF EXISTS "Restricted Upload alankar-images" ON storage.objects;
  DROP POLICY IF EXISTS "Restricted Upload alankar-videos" ON storage.objects;

  -- 1. Public Read Policy
  CREATE POLICY "Public Read alankar-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'alankar-images');

  CREATE POLICY "Public Read alankar-videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'alankar-videos');

  -- 2. Hardened Upload Policy for Photos
  CREATE POLICY "Restricted Upload alankar-images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'alankar-images'
    AND split_part(name, '/', 2) IN ('photos', 'images')
    AND lower(name) ~ '\.(jpg|jpeg|png|webp|gif)$'
    AND EXISTS (
      SELECT 1 FROM public.mandals
      WHERE slug = split_part(name, '/', 1)
         OR id::text = split_part(name, '/', 1)
    )
  );

  -- 3. Hardened Upload Policy for Videos
  CREATE POLICY "Restricted Upload alankar-videos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'alankar-videos'
    AND split_part(name, '/', 2) IN ('videos')
    AND lower(name) ~ '\.(mp4|webm|mov)$'
    AND EXISTS (
      SELECT 1 FROM public.mandals
      WHERE slug = split_part(name, '/', 1)
         OR id::text = split_part(name, '/', 1)
    )
  );
END $$;
