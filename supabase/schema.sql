-- ============================================================================
-- FLORISTMART DATABASE SCHEMA
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor > New Query
-- ============================================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── PROFILES (data tambahan untuk user, terhubung ke auth.users) ───────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text default '',
  avatar_url text default '',
  theme_color text not null default '#f43f5e',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- ─── ADDRESSES (multi-alamat per user) ───────────────────────────────────────
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'Rumah',
  recipient_name text not null,
  recipient_phone text not null,
  full_address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── BANNERS (promo banner di beranda, dikelola admin) ───────────────────────
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  image_url text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
create table if not exists categories (
  id text primary key,
  label text not null,
  emoji text not null,
  color text not null,
  sort_order int not null default 0
);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric not null,
  original_price numeric,
  category_id text references categories(id),
  image_url text default '',
  stock int not null default 0,
  sold int not null default 0,
  tags text[] default '{}',
  is_new boolean not null default false,
  is_flash_sale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── PRODUCT REVIEWS ──────────────────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now()
);

-- ─── WISHLIST ─────────────────────────────────────────────────────────────────
create table if not exists wishlist_items (
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  total_amount numeric not null,
  shipping_fee numeric not null default 0,
  discount numeric not null default 0,
  grand_total numeric not null,
  payment_method text not null,
  shipping_address text not null,
  recipient_name text not null,
  recipient_phone text not null,
  note text default '',
  delivery_date text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── ORDER ITEMS ──────────────────────────────────────────────────────────────
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_price numeric not null,
  product_image text default '',
  quantity int not null,
  note text default ''
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create profile saat user baru register
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), coalesce(new.raw_user_meta_data->>'phone', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-notify user saat status order berubah
create or replace function notify_order_status_change()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (user_id, title, body)
    values (
      new.user_id,
      'Status Pesanan Diperbarui',
      'Pesanan ' || new.order_code || ' sekarang: ' || new.status
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_status_change on orders;
create trigger on_order_status_change
  after update on orders
  for each row execute function notify_order_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table banners enable row level security;
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table reviews enable row level security;
alter table wishlist_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table notifications enable row level security;

-- Helper: cek apakah user saat ini admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- BANNERS: semua bisa lihat yang aktif, hanya admin bisa kelola
create policy "banners_select_active_or_admin" on banners for select using (active or is_admin());
create policy "banners_write_admin" on banners for insert with check (is_admin());
create policy "banners_update_admin" on banners for update using (is_admin());
create policy "banners_delete_admin" on banners for delete using (is_admin());

-- PROFILES: user lihat/edit profil sendiri, admin lihat semua
create policy "profiles_select_own_or_admin" on profiles for select
  using (auth.uid() = id or is_admin());
create policy "profiles_update_own" on profiles for update
  using (auth.uid() = id);

-- ADDRESSES: hanya milik sendiri
create policy "addresses_all_own" on addresses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CATEGORIES: semua orang bisa baca, hanya admin bisa ubah
create policy "categories_select_all" on categories for select using (true);
create policy "categories_write_admin" on categories for insert with check (is_admin());
create policy "categories_update_admin" on categories for update using (is_admin());
create policy "categories_delete_admin" on categories for delete using (is_admin());

-- PRODUCTS: semua orang bisa baca, hanya admin bisa ubah
create policy "products_select_all" on products for select using (true);
create policy "products_write_admin" on products for insert with check (is_admin());
create policy "products_update_admin" on products for update using (is_admin());
create policy "products_delete_admin" on products for delete using (is_admin());

-- REVIEWS: semua bisa baca, user login bisa tulis review sendiri
create policy "reviews_select_all" on reviews for select using (true);
create policy "reviews_insert_own" on reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own_or_admin" on reviews for delete using (auth.uid() = user_id or is_admin());

-- WISHLIST: hanya milik sendiri
create policy "wishlist_all_own" on wishlist_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ORDERS: user lihat pesanan sendiri, admin lihat semua; admin bisa update status
create policy "orders_select_own_or_admin" on orders for select
  using (auth.uid() = user_id or is_admin());
create policy "orders_insert_own" on orders for insert
  with check (auth.uid() = user_id);
create policy "orders_update_own_or_admin" on orders for update
  using (auth.uid() = user_id or is_admin());

-- ORDER_ITEMS: ikut aturan order induknya
create policy "order_items_select" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));
create policy "order_items_insert" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- NOTIFICATIONS: hanya milik sendiri
create policy "notifications_select_own" on notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on notifications for update using (auth.uid() = user_id);
create policy "notifications_insert_system" on notifications for insert with check (true);

-- ============================================================================
-- STORAGE BUCKET untuk foto profil (avatar)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars_own_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_own_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_own_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- STORAGE BUCKET untuk gambar produk
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product_images_admin_write" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());
create policy "product_images_admin_update" on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());
create policy "product_images_admin_delete" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ============================================================================
-- SEED DATA — kategori & beberapa produk contoh
-- ============================================================================
insert into categories (id, label, emoji, color, sort_order) values
  ('wisuda',     'Wisuda',      '🎓', '#fde68a', 1),
  ('ultah',      'Ulang Tahun', '🎂', '#fca5a5', 2),
  ('pernikahan', 'Pernikahan',  '💍', '#c4b5fd', 3),
  ('segar',      'Bunga Segar', '🌹', '#6ee7b7', 4)
on conflict (id) do nothing;

insert into products (name, description, price, original_price, category_id, image_url, stock, sold, tags, is_new, is_flash_sale) values
  ('Buket Wisuda Elegance', 'Buket wisuda mewah dengan kombinasi mawar pink dan baby breath.', 185000, 230000, 'wisuda', 'https://images.unsplash.com/photo-1775541398083-4e2ff8d50eab?w=500&q=80', 25, 1840, array['mawar','pink','wisuda'], false, true),
  ('Buket Wisuda Sunflower', 'Buket cerah dengan bunga matahari dan mawar kuning.', 155000, null, 'wisuda', 'https://images.unsplash.com/photo-1718960757629-255334117e2c?w=500&q=80', 18, 920, array['sunflower','wisuda'], true, false),
  ('Buket Ulang Tahun Sweet Pink', 'Buket cantik dengan mawar pink, spray rose, dan eustoma putih.', 125000, 160000, 'ultah', 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=500&q=80', 30, 2310, array['mawar pink','ulang tahun'], false, true)
on conflict do nothing;

-- ============================================================================
-- CATATAN PENTING SETELAH MENJALANKAN SCRIPT INI:
-- Untuk membuat akun ADMIN pertama:
-- 1. Register user baru lewat aplikasi (jadi 'customer' secara default)
-- 2. Di SQL Editor, jalankan:
--    update profiles set role = 'admin' where id =
--      (select id from auth.users where email = 'email_admin_kamu@contoh.com');
-- ============================================================================
