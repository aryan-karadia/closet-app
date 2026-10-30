-- Migration 008: wear_logs (refs ISSUE-24)
-- Depends on 007 (outfits). Item snapshots are stored as JSON so later item deletion does not rewrite history.
create table if not exists public.wear_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outfit_id uuid not null references public.outfits (id) on delete restrict,
  item_ids uuid[] not null default '{}',
  item_snapshots jsonb not null default '[]'::jsonb,
  worn_at timestamptz not null default now(),
  occasion text check (occasion is null or occasion in ('daily','interview','formal','japan-travel','date-evening')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wear_logs_user_idx on public.wear_logs (user_id);
create index if not exists wear_logs_outfit_idx on public.wear_logs (outfit_id);
alter table public.wear_logs enable row level security;
drop policy if exists wear_logs_select_own on public.wear_logs;
create policy wear_logs_select_own on public.wear_logs for select using (auth.uid() = user_id);
drop policy if exists wear_logs_insert_own on public.wear_logs;
create policy wear_logs_insert_own on public.wear_logs for insert with check (auth.uid() = user_id);
drop policy if exists wear_logs_update_own on public.wear_logs;
create policy wear_logs_update_own on public.wear_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists wear_logs_delete_own on public.wear_logs;
create policy wear_logs_delete_own on public.wear_logs for delete using (auth.uid() = user_id);
