-- Migration 006: advice_rules (refs ISSUE-24)
-- Depends on 001 (profiles). Starting rules are seeded by the API seed endpoint, not by a migration, because they are per user.
create table if not exists public.advice_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  condition_category text,
  condition_fit_tag text,
  condition_colour_family text check (condition_colour_family is null or condition_colour_family in ('blue','green','purple','red','teal','plum','burgundy','black','gray','navy','orange','brown','pink','yellow','white','other')),
  action text not null check (action in ('prefer','avoid','require')),
  weight double precision not null default 50 check (weight >= 0 and weight <= 100),
  reason text not null check (char_length(reason) between 1 and 500),
  source text not null check (char_length(source) between 1 and 200),
  source_text text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists advice_rules_user_idx on public.advice_rules (user_id);
alter table public.advice_rules enable row level security;
drop policy if exists advice_rules_select_own on public.advice_rules;
create policy advice_rules_select_own on public.advice_rules for select using (auth.uid() = user_id);
drop policy if exists advice_rules_insert_own on public.advice_rules;
create policy advice_rules_insert_own on public.advice_rules for insert with check (auth.uid() = user_id);
drop policy if exists advice_rules_update_own on public.advice_rules;
create policy advice_rules_update_own on public.advice_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists advice_rules_delete_own on public.advice_rules;
create policy advice_rules_delete_own on public.advice_rules for delete using (auth.uid() = user_id);
