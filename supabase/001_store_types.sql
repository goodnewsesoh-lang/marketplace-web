-- Nexta Shop, step 1: store types, "my type isn't here" requests, and demo-data clean-up.
-- Run once in Supabase > SQL Editor (paste everything, then click Run).
-- Safe to run again: it will not duplicate anything.

-- ========== STORE TYPES ==========
create table if not exists public.store_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  tagline text,
  icon text not null default 'grid',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.store_types enable row level security;

drop policy if exists "store types read" on public.store_types;
create policy "store types read" on public.store_types
  for select using (is_active or public.is_admin());

drop policy if exists "store types admin write" on public.store_types;
create policy "store types admin write" on public.store_types
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.store_types (slug, name, tagline, icon, sort_order) values
  ('music',    'Music store',    'Share tracks and albums with fans.',  'music',    1),
  ('books',    'Book store',     'Showcase books, guides and stories.', 'book',     2),
  ('digital',  'Digital store',  'Templates, courses, files and more.', 'download', 3),
  ('fashion',  'Fashion store',  'Clothes, shoes, bags and accessories.', 'shirt',  4),
  ('services', 'Services store', 'Offer your skills and bookings.',     'wrench',   5),
  ('general',  'General store',  'Anything else you want to sell.',     'grid',     6)
on conflict (slug) do nothing;

-- ========== "MY TYPE ISN'T HERE" REQUESTS ==========
create table if not exists public.store_type_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null
    check (char_length(email) between 5 and 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  store_type_wanted text not null check (char_length(store_type_wanted) between 2 and 120),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'created', 'declined')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

alter table public.store_type_requests enable row level security;

-- Anyone (even not logged in) can send a request, but cannot read anyone's.
drop policy if exists "requests insert" on public.store_type_requests;
create policy "requests insert" on public.store_type_requests
  for insert with check (status = 'pending');

drop policy if exists "requests admin read" on public.store_type_requests;
create policy "requests admin read" on public.store_type_requests
  for select using (public.is_admin());

drop policy if exists "requests admin update" on public.store_type_requests;
create policy "requests admin update" on public.store_type_requests
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "requests admin delete" on public.store_type_requests;
create policy "requests admin delete" on public.store_type_requests
  for delete using (public.is_admin());

-- ========== CLEAR THE DEMO PRODUCTS FROM THE APP TESTING ==========
delete from public.products where slug like 'demo-%';
