-- Migration 007: outfits and outfit_items (refs ISSUE-24)
-- Depends on 004 (items).
create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occasion text not null check (occasion in ('daily','interview','formal','japan-travel','date-evening')),
  season text not null check (season in ('winter','spring','autumn','summer','all-season')),
  vibe text check (vibe is null or vibe in ('structured-softboy','clean-minimal','light-old-money','streetwear-minimal')),
  palette_score double precision check (palette_score is null or (palette_score >= 0 and palette_score <= 100)),
  fit_score double precision check (fit_score is null or (fit_score >= 0 and fit_score <= 100)),
  contrast_score double precision check (contrast_score is null or (contrast_score >= 0 and contrast_score <= 100)),
  rotation_score double precision check (rotation_score is null or (rotation_score >= 0 and rotation_score <= 100)),
  total_score double precision check (total_score is null or (total_score >= 0 and total_score <= 100)),
  explanation text[] not null default '{}',
  saved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists outfits_user_idx on public.outfits (user_id);
alter table public.outfits enable row level security;
drop policy if exists outfits_select_own on public.outfits;
create policy outfits_select_own on public.outfits for select using (auth.uid() = user_id);
drop policy if exists outfits_insert_own on public.outfits;
create policy outfits_insert_own on public.outfits for insert with check (auth.uid() = user_id);
drop policy if exists outfits_update_own on public.outfits;
create policy outfits_update_own on public.outfits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists outfits_delete_own on public.outfits;
create policy outfits_delete_own on public.outfits for delete using (auth.uid() = user_id);

create table if not exists public.outfit_items (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  slot text not null check (slot in ('base-top','outer-layer','bottom','shoes','accessory')),
  created_at timestamptz not null default now(),
  primary key (outfit_id, item_id),
  unique (outfit_id, slot)
);
create index if not exists outfit_items_outfit_idx on public.outfit_items (outfit_id);
create index if not exists outfit_items_item_idx on public.outfit_items (item_id);
alter table public.outfit_items enable row level security;
drop policy if exists outfit_items_select_own on public.outfit_items;
create policy outfit_items_select_own on public.outfit_items for select using (auth.uid() = user_id and exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid()));
drop policy if exists outfit_items_insert_own on public.outfit_items;
create policy outfit_items_insert_own on public.outfit_items for insert with check (auth.uid() = user_id and exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid()));
drop policy if exists outfit_items_update_own on public.outfit_items;
create policy outfit_items_update_own on public.outfit_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists outfit_items_delete_own on public.outfit_items;
create policy outfit_items_delete_own on public.outfit_items for delete using (auth.uid() = user_id);
