-- Create videos table for Cloudinary references
-- Run this in Supabase SQL Editor

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  public_id text,
  publicId text,
  autor text not null,
  titulo text not null,
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

-- MVP permissive policies
create policy if not exists "videos_select_all"
  on public.videos
  for select
  using (true);

create policy if not exists "videos_insert_all"
  on public.videos
  for insert
  with check (true);

create policy if not exists "videos_update_all"
  on public.videos
  for update
  using (true)
  with check (true);

create policy if not exists "videos_delete_all"
  on public.videos
  for delete
  using (true);
