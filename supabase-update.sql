-- Run this once in Supabase SQL Editor to support WhatsApp donation receipts.
alter table public.donations add column if not exists phone text default '';
