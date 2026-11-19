-- =====================================================
-- NEW CLIENT DATABASE SETUP — run ONCE in a brand-new Supabase project
-- (SQL Editor → paste everything → Run)
-- Creates: products, orders, admins, security rules, photo storage.
-- =====================================================

-- ===================== PART A: STORE TABLES =====================

-- 1. PRODUCTS table: everything the store sells
create table products (
  id bigint generated always as identity primary key,
  name text not null,
  price integer not null,
  category text not null,
  sizes text[] not null default '{}',
  image text,
  description text,
  created_at timestamptz not null default now()
);

-- 2. ORDERS table: every order a customer places
create table orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  items jsonb not null,           -- the cart: [{ "name": ..., "size": ..., "price": ... }]
  total integer not null,
  status text not null default 'new',   -- new → confirmed → delivered
  created_at timestamptz not null default now()
);

-- 3. SECURITY (Row Level Security): lock both tables...
alter table products enable row level security;
alter table orders enable row level security;

-- ...then open only what the public website needs:
-- visitors may READ products
create policy "Anyone can view products"
  on products for select
  to anon, authenticated
  using (true);

-- visitors may CREATE an order (but cannot read other people's orders)
create policy "Anyone can place an order"
  on orders for insert
  to anon, authenticated
  with check (true);

-- 3b. Let the public website use the tables at all
-- (the policies above still decide WHAT it can do)
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.orders to anon, authenticated;

-- ===================== PART B: ADMIN (OWNER) ACCESS =====================
-- B1. ADMINS table: which logged-in users are shop owners
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;

-- an admin may see their own row (needed for the checks below)
create policy "Admins can see themselves"
  on admins for select
  to authenticated
  using (user_id = (select auth.uid()));
grant select on public.admins to authenticated;

-- B2. ORDERS: only admins may read and update orders
create policy "Admins can view orders"
  on orders for select
  to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())));

create policy "Admins can update orders"
  on orders for update
  to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));

grant select, update on public.orders to authenticated;

-- ===================== PART C: PRODUCTS MANAGEMENT + PHOTOS =====================
-- C1. Admins may add, edit and delete products
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

-- C2. A public "bucket" (folder) for product photos: max 5 MB, images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/*']);

-- C3. Only admins may upload, replace or delete photos (anyone can VIEW them)
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

-- ===================== PART D: AFTER RUNNING THIS =====================
-- 1. Authentication → Sign In / Providers → turn OFF "Allow new users to sign up" → Save
-- 2. Authentication → Users → Add user → the owner's email + password (Auto Confirm ON)
-- 3. Then run this ONE line to make that user the shop owner:
-- insert into admins (user_id) select id from auth.users;
