-- =====================================================
-- NOVA Wear — products management + photo storage
-- =====================================================

-- 1. Admins may add, edit and delete products
create policy "Admins can add products"
  on products for insert
  to authenticated
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));

create policy "Admins can edit products"
  on products for update
  to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));

create policy "Admins can delete products"
  on products for delete
  to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())));

grant insert, update, delete on public.products to authenticated;

-- 2. A public "bucket" (folder) for product photos: max 5 MB, images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/*']);

-- 3. Only admins may upload, replace or delete photos (anyone can VIEW them)
create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.admins where user_id = (select auth.uid()))
  );

create policy "Admins can update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admins where user_id = (select auth.uid()))
  );

create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admins where user_id = (select auth.uid()))
  );
