-- Migration 010: updated_at triggers (refs ISSUE-24)
-- Apply last. Keeps updated_at current without application code having to remember it.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
do $$
declare t text;
begin
  foreach t in array array['profiles','palettes','palette_colors','avoid_rules','items','advice_rules','outfits','wear_logs'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
