-- ─────────────────────────────────────────────
-- CloudVault — Supabase Schema
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Folders table
create table public.folders (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  parent_id   uuid references public.folders(id) on delete cascade,
  created_at  timestamptz default now()
);

-- Files table
create table public.files (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  folder_id     uuid references public.folders(id) on delete set null,
  name          text not null,
  size          bigint default 0,
  mime_type     text,
  storage_path  text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger files_updated_at
  before update on public.files
  for each row execute function update_updated_at();

-- Row Level Security
alter table public.folders enable row level security;
alter table public.files   enable row level security;

-- Folders: users can only access their own
create policy "folders_owner" on public.folders
  using (auth.uid() = user_id);

-- Files: users can only access their own
create policy "files_owner" on public.files
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Supabase Storage bucket
-- ─────────────────────────────────────────────
-- Run this in the Supabase Dashboard → Storage:
-- 1. Create a bucket named: user-files
-- 2. Set it to PRIVATE
-- 3. Add a storage policy:
--    Name: "Users manage own files"
--    Allowed operations: SELECT, INSERT, DELETE
--    Policy: (auth.uid()::text) = (storage.foldername(name))[1]
