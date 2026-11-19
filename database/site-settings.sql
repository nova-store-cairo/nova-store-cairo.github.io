-- =====================================================
-- Editable website texts and hero photo (edited from the store itself)
-- =====================================================
create table site_settings (
  key text primary key,          -- e.g. 'hero_title'
  value text not null,           -- e.g. 'Built for Cairo nights.'
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;

-- everyone can READ the texts (the store shows them)
create policy "Anyone can read site settings"
  on site_settings for select
  to anon, authenticated
  using (true);

-- only admins can ADD or CHANGE them
create policy "Admins can add site settings"
  on site_settings for insert
  to authenticated
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));

create policy "Admins can change site settings"
  on site_settings for update
  to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));

grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
