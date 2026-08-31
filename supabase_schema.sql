-- ========================================================
-- Schema SQL untuk Aplikasi Catatan Sederhana (Supabase)
-- ========================================================

-- 1. Buat Tabel notes
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Aktifkan Row Level Security (RLS)
alter table public.notes enable row level security;

-- 3. Policy: User hanya dapat membaca (SELECT) catatan milik sendiri
create policy "User dapat membaca catatan sendiri"
  on public.notes for select
  using (auth.uid() = user_id);

-- 4. Policy: User dapat membuat (INSERT) catatan milik sendiri
create policy "User dapat membuat catatan baru"
  on public.notes for insert
  with check (auth.uid() = user_id);

-- 5. Policy: User dapat memperbarui (UPDATE) catatan milik sendiri
create policy "User dapat mengubah catatan sendiri"
  on public.notes for update
  using (auth.uid() = user_id);

-- 6. Policy: User dapat menghapus (DELETE) catatan milik sendiri
create policy "User dapat menghapus catatan sendiri"
  on public.notes for delete
  using (auth.uid() = user_id);
