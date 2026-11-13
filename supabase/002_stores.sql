-- Phase 2: link each store to a store type. Run AFTER 001_store_types.sql.
alter table public.seller_profiles
  add column if not exists store_type_id uuid references public.store_types(id);

create index if not exists seller_profiles_store_type_idx
  on public.seller_profiles(store_type_id);
