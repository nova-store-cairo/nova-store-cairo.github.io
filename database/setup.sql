-- =====================================================
-- NOVA Wear — database setup (run once in Supabase SQL Editor)
-- =====================================================

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

-- 4. Copy the current products into the database
insert into products (name, price, category, sizes, image, description) values
  ('Black Hoodie', 1200, 'hoodies', array['S', 'M', 'L', 'XL'], 'https://placehold.co/400x500?text=Black+Hoodie', 'Heavyweight cotton hoodie with an oversized fit.'),
  ('Grey Hoodie', 1150, 'hoodies', array['S', 'M', 'L', 'XL'], 'https://placehold.co/400x500?text=Grey+Hoodie', 'Soft fleece hoodie, perfect for Cairo winter nights.'),
  ('Cargo Pants', 950, 'pants', array['30', '32', '34', '36'], 'https://placehold.co/400x500?text=Cargo+Pants', 'Relaxed cargo pants with six pockets.'),
  ('Wide-leg Jeans', 1100, 'pants', array['30', '32', '34', '36'], 'https://placehold.co/400x500?text=Wide-leg+Jeans', 'Washed denim with a loose, wide-leg cut.'),
  ('White Tee', 450, 'tees', array['S', 'M', 'L', 'XL'], 'https://placehold.co/400x500?text=White+Tee', 'Everyday 100% cotton tee.'),
  ('Black Tee', 450, 'tees', array['S', 'M', 'L', 'XL'], 'https://placehold.co/400x500?text=Black+Tee', 'Everyday 100% cotton tee in black.'),
  ('Denim Jacket', 1500, 'jackets', array['S', 'M', 'L', 'XL'], 'https://placehold.co/400x500?text=Denim+Jacket', 'Classic washed denim jacket.');
