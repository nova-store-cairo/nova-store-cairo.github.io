-- =====================================================
-- NOVA Wear — admin setup (run in Supabase SQL Editor)
-- =====================================================

-- 1. ADMINS table: which logged-in users are shop owners
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

-- 2. ORDERS: only admins may read and update orders
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

-- 3. Run this LAST, after creating the owner's user in Authentication → Users:
-- insert into admins (user_id) select id from auth.users;
