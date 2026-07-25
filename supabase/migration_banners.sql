-- ============================================================================
-- MIGRASI: Banner Promo (dikelola Admin)
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================================

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  image_url text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table banners enable row level security;

drop policy if exists "banners_select_active_or_admin" on banners;
create policy "banners_select_active_or_admin" on banners for select using (active or is_admin());

drop policy if exists "banners_write_admin" on banners;
create policy "banners_write_admin" on banners for insert with check (is_admin());

drop policy if exists "banners_update_admin" on banners;
create policy "banners_update_admin" on banners for update using (is_admin());

drop policy if exists "banners_delete_admin" on banners;
create policy "banners_delete_admin" on banners for delete using (is_admin());
