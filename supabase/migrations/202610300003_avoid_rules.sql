-- Migration 003: avoid_rules (refs ISSUE-24)
-- Depends on 002 (palettes).
create table if not exists public.avoid_rules (
  id uuid primary key default gen_random_uuid(),
  palette_id uuid not null references public.palettes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  hue_min double precision not null check (hue_min >= 0 and hue_min <= 360),
  hue_max double precision not null check (hue_max >= 0 and hue_max <= 360),
  saturation_min double precision not null check (saturation_min >= 0 and saturation_min <= 100),
  saturation_max double precision not null check (saturation_max >= 0 and saturation_max <= 100),
  lightness_min double precision not null check (lightness_min >= 0 and lightness_min <= 100),
  lightness_max double precision not null check (lightness_max >= 0 and lightness_max <= 100),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (hue_min <= hue_max),
  check (saturation_min <= saturation_max),
  check (lightness_min <= lightness_max)
);
create index if not exists avoid_rules_palette_idx on public.avoid_rules (palette_id);
create index if not exists avoid_rules_user_idx on public.avoid_rules (user_id);
alter table public.avoid_rules enable row level security;
drop policy if exists avoid_rules_select_own on public.avoid_rules;
create policy avoid_rules_select_own on public.avoid_rules for select using (auth.uid() = user_id);
drop policy if exists avoid_rules_insert_own on public.avoid_rules;
create policy avoid_rules_insert_own on public.avoid_rules for insert with check (auth.uid() = user_id);
drop policy if exists avoid_rules_update_own on public.avoid_rules;
create policy avoid_rules_update_own on public.avoid_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists avoid_rules_delete_own on public.avoid_rules;
create policy avoid_rules_delete_own on public.avoid_rules for delete using (auth.uid() = user_id);
