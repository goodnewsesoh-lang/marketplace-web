# Nexta Shop (marketplace-web)

A website where any kind of seller can open a store themed to what they sell: music, books,
digital products, fashion, services and more. Built with Next.js and Supabase.

## What is built so far

- Phase 1: project, purple theme, Home page, store types from the database, daily keep-alive.

## Set up

1. In Supabase, open **SQL Editor** and run `supabase/001_store_types.sql` once.
2. Copy `.env.example` to `.env.local` and fill in the two Supabase values
   (Project Settings > API: Project URL and the publishable key).
3. `npm install` then `npm run dev`.

## Deploying on Vercel

1. Import this repo in Vercel.
2. Add the two environment variables from `.env.example` (same names, same values).
3. Deploy. The daily keep-alive runs from `vercel.json`.

## Notes

- Brand name lives in one place: `lib/config.ts`.
- The logo in `components/Logo.tsx` is a placeholder. Replace it with the real logo file.
- Never put the Supabase secret key in this project.

## Phase 2: accounts and registration

Run `supabase/001_store_types.sql` then `supabase/002_stores.sql` in the Supabase SQL Editor.
Pages: `/register`, `/login`, `/forgot-password`, `/reset-password`, `/dashboard`.
