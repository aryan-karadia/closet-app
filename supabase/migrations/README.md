# Supabase migrations (refs ISSUE-24)

Apply in filename order. Do not reorder. Each file is idempotent where practical (create table if not exists, drop policy if exists before create policy), so a failed apply can be retried, but a partially applied migration should still be reviewed before retrying.

## Migration order

1. `202610300001_profiles.sql`: profiles, keyed by auth user id.
2. `202610300002_palettes.sql`: palettes and palette_colors, plus the profiles.active_palette_id foreign key, which needs palettes to exist first.
3. `202610300003_avoid_rules.sql`: avoid_rules, referencing palettes.
4. `202610300004_items.sql`: items, including the nullable location field only (no location flow in MVP).
5. `202610300005_item_colors.sql`: item_colors, referencing items.
6. `202610300006_advice_rules.sql`: advice_rules. Starting rules are seeded per user by the API seed endpoint, not by a migration, because they are per user records.
7. `202610300007_outfits.sql`: outfits and outfit_items, referencing items. Outfit items enforce one item per slot per outfit with a unique constraint on (outfit_id, slot).
8. `202610300008_wear_logs.sql`: wear_logs, referencing outfits. Item snapshots are JSON so later item deletion does not rewrite history.
9. `202610300009_storage_bucket.sql`: private `closet-images` bucket and storage policies on the `items/<user_id>/` path layout. The bucket is private, never public.
10. `202610300010_updated_at.sql`: updated_at triggers for all tables that carry updated_at.

## RLS rule

Every table has RLS enabled, with select, insert, update, and delete policies restricted to `auth.uid() = user_id`. Join tables (item_colors, outfit_items) additionally check ownership through the parent record. The API enforces the same ownership rule in code (403 for wrong owner, 404 for missing), so RLS is a second layer, not the only layer.

## How to apply

With the Supabase CLI, from the repo root, after linking a project (placeholders only in this repo, never commit real credentials):

```
supabase link --project-ref <your-project-ref>
supabase db push
```

Without a live project, these files are still the schema source of truth for the API field mapping: API camelCase fields map to the snake_case columns here (for example `paletteId` to `palette_id`, `userId` to `user_id`).

## How to test

- Check that every table in spec section 16.3 has a migration: profiles, palettes, palette_colors, avoid_rules, items, item_colors, advice_rules, outfits, outfit_items, wear_logs.
- Check that every migration enables RLS and creates policies for select, insert, update, and delete.
- Run the Agent C suite: `sh scripts/check-tests.sh` from the repo root. Migrations alone do not change test counts.
