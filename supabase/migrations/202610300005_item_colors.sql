-- Migration 005: item_colors (refs ISSUE-24)
-- Depends on 004 (items). RLS is enforced both on user_id and through the owning item.
create table if not exists public.item_colors (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  lab_l double precision,
  lab_a double precision,
  lab_b double precision,
  percentage double precision not null check (percentage >= 0 and percentage <= 100),
  is_primary boolean not null default false,
  family text,
  created_at timestamptz not null default now()
);
create index if not exists item_colors_item_idx on public.item_colors (item_id);
create index if not exists item_colors_user_idx on public.item_colors (user_id);
alter table public.item_colors enable row level security;
drop policy if exists item_colors_select_own on public.item_colors;
create policy item_colors_select_own on public.item_colors for select using (auth.uid() = user_id and exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));
drop policy if exists item_colors_insert_own on public.item_colors;
create policy item_colors_insert_own on public.item_colors for insert with check (auth.uid() = user_id and exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid()));
drop policy if exists item_colors_update_own on public.item_colors;
create policy item_colors_update_own on public.item_colors for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists item_colors_delete_own on public.item_colors;
create policy item_colors_delete_own on public.item_colors for delete using (auth.uid() = user_id);
