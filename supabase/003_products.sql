-- Phase 3: products with currency and store-type details. Run AFTER 002_stores.sql.
alter table public.products add column if not exists currency text not null default 'NGN';
alter table public.products add column if not exists negotiable boolean not null default false;
alter table public.products add column if not exists delivery text;
alter table public.products add column if not exists allow_sharing boolean not null default true;
alter table public.products add column if not exists extras jsonb not null default '{}'::jsonb;

-- A category is now optional (the store type already describes what is sold).
alter table public.products alter column category_id drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_currency_check') then
    alter table public.products
      add constraint products_currency_check check (currency in ('NGN','USD','GBP','EUR','GHS'));
  end if;
end $$;
