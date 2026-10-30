-- Migration 002: palettes and palette_colors (refs ISSUE-24)
-- Depends on 001 (profiles). active_palette_id is added after palettes exist.
create table if not exists public.palettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  source_file_name text,
  uploaded_at timestamptz not null default now(),
  is_active boolean not null default false,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists palettes_user_id_idx on public.palettes (user_id);
create index if not exists palettes_user_active_idx on public.palettes (user_id, is_active);
alter table public.palettes enable row level security;
drop policy if exists palettes_select_own on public.palettes;
create policy palettes_select_own on public.palettes for select using (auth.uid() = user_id);
drop policy if exists palettes_insert_own on public.palettes;
create policy palettes_insert_own on public.palettes for insert with check (auth.uid() = user_id);
drop policy if exists palettes_update_own on public.palettes;
create policy palettes_update_own on public.palettes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists palettes_delete_own on public.palettes;
create policy palettes_delete_own on public.palettes for delete using (auth.uid() = user_id);

create table if not exists public.palette_colors (
  id uuid primary key default gen_random_uuid(),
  palette_id uuid not null references public.palettes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  lab_l double precision,
  lab_a double precision,
  lab_b double precision,
  hue double precision check (hue is null or (hue >= 0 and hue <= 360)),
  saturation double precision check (saturation is null or (saturation >= 0 and saturation <= 100)),
  lightness double precision check (lightness is null or (lightness >= 0 and lightness <= 100)),
  family text not null check (family in ('blue','green','purple','red','teal','plum','burgundy','black','gray','navy','orange','brown','pink','yellow','white','other')),
  role text not null check (role in ('core','neutral','avoid')),
  source_page integer check (source_page is null or source_page >= 1),
  is_manual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists palette_colors_palette_idx on public.palette_colors (palette_id);
create index if not exists palette_colors_user_idx on public.palette_colors (user_id);
alter table public.palette_colors enable row level security;
drop policy if exists palette_colors_select_own on public.palette_colors;
create policy palette_colors_select_own on public.palette_colors for select using (auth.uid() = user_id);
drop policy if exists palette_colors_insert_own on public.palette_colors;
create policy palette_colors_insert_own on public.palette_colors for insert with check (auth.uid() = user_id);
drop policy if exists palette_colors_update_own on public.palette_colors;
create policy palette_colors_update_own on public.palette_colors for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists palette_colors_delete_own on public.palette_colors;
create policy palette_colors_delete_own on public.palette_colors for delete using (auth.uid() = user_id);

-- Profiles.active_palette_id now has a target table. Add the foreign key if missing.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_active_palette_fk') then
    alter table public.profiles add constraint profiles_active_palette_fk foreign key (active_palette_id) references public.palettes (id) on delete set null;
  end if;
end $$;
