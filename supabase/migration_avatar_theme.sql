-- ============================================================================
-- MIGRASI: Foto Profil + Tema Warna
-- Jalankan di Supabase Dashboard > SQL Editor (project yang SUDAH ada datanya)
-- ============================================================================

-- 1. Tambah kolom tema warna ke profiles
alter table profiles add column if not exists theme_color text not null default '#f43f5e';

-- 2. Buat storage bucket untuk foto profil
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. RLS: setiap user hanya boleh upload/update/hapus foto miliknya sendiri,
--    tapi foto bisa dibaca publik (supaya bisa ditampilkan di UI)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_own_write" on storage.objects;
create policy "avatars_own_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
