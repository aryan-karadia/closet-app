-- Migration 004: items (refs ISSUE-24)
-- Depends on 001 (profiles). Location is a nullable field only, no location flow in MVP (spec section 3).
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  category text not null check (char_length(category) between 1 and 100),
  season text not null check (season in ('winter','spring','autumn','summer','all-season')),
  fit_tags text[] not null default '{}',
  status text not null default 'in rotation' check (status in ('in rotation','stored','archived')),
  price numeric(12,2) check (price is null or price >= 0),
  location text,
  photo_path text,
  thumbnail_path text,
  primary_color_hex text check (primary_color_hex is null or primary_color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  palette_score double precision check (palette_score is null or (palette_score >= 0 and palette_score <= 100)),
  palette_verdict text check (palette_verdict is null or palette_verdict in ('Perfect','Strong','Works','Avoid')),
  nearest_palette_color_id uuid,
  nearest_palette_color_name text,
  rating_reason text,
  auto_score double precision check (auto_score is null or (auto_score >= 0 and auto_score <= 100)),
  manual_score double precision check (manual_score is null or (manual_score >= 0 and manual_score <= 100)),
  manual_score_note text,
  wear_count integer not null default 0 check (wear_count >= 0),
  last_worn_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_user_idx on public.items (user_id);
create index if not exists items_user_status_idx on public.items (user_id, status);
create index if not exists items_user_category_idx on public.items (user_id, category);
alter table public.items enable row level security;
drop policy if exists items_select_own on public.items;
create policy items_select_own on public.items for select using (auth.uid() = user_id);
drop policy if exists items_insert_own on public.items;
create policy items_insert_own on public.items for insert with check (auth.uid() = user_id);
drop policy if exists items_update_own on public.items;
create policy items_update_own on public.items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists items_delete_own on public.items;
create policy items_delete_own on public.items for delete using (auth.uid() = user_id);
