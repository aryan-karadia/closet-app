-- Migration 009: private storage bucket and storage policies (refs ISSUE-24, ISSUE-25)
-- Bucket is private. No public access. Access is through signed URLs only.
insert into storage.buckets (id, name, public)
values ('closet-images', 'closet-images', false)
on conflict (id) do nothing;
-- Storage policies use the items/<user_id>/ path layout from the API contract.
drop policy if exists closet_images_select_own on storage.objects;
create policy closet_images_select_own on storage.objects for select using (bucket_id = 'closet-images' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists closet_images_insert_own on storage.objects;
create policy closet_images_insert_own on storage.objects for insert with check (bucket_id = 'closet-images' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists closet_images_update_own on storage.objects;
create policy closet_images_update_own on storage.objects for update using (bucket_id = 'closet-images' and (storage.foldername(name))[2] = auth.uid()::text) with check (bucket_id = 'closet-images' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists closet_images_delete_own on storage.objects;
create policy closet_images_delete_own on storage.objects for delete using (bucket_id = 'closet-images' and (storage.foldername(name))[2] = auth.uid()::text);
