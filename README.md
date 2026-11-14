# HKUST Marketplace

COMP3111 F2026, Group 34 (Non-Honors). Buyer, seller, and admin portals from the Canvas Task 1–3 spec, backed by Supabase Auth + Postgres.

## Password strength rules

Registration and profile password updates require all of:

- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number

Confirm-password is checked only in the browser. Passwords are hashed by Supabase Auth and are never stored in Postgres or in this repository.

## Setup

1. Install dependencies (`npm install` or `pnpm install`).
2. Copy `.env.example` to `.env.local` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable / anon key only — never a `service_role` / `sb_secret` key)
3. Apply the schema: Supabase Dashboard → **SQL Editor** → paste `supabase/001_schema.sql` → **Run**.
4. Seed the admin Auth user (see below).
5. In Authentication → Providers → Email, turn **off** “Confirm email” for local/demo grading so registration can sign in immediately.
6. Start the app with `npm run dev` (or `pnpm dev`).

## Seed the admin account

Admin has **no** public registration screen. Create the user in the dashboard (do not put the password in git):

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**.
2. Email: `admin@ust.hk`
3. Set a strong password and keep it only in your password manager / demo notes.
4. Enable **Auto Confirm User**.
5. Save. A database trigger creates `profiles.role = admin` for this email.

Sign in through **Admin Login** with username `admin@ust.hk` and that dashboard password.

## User deletion

Permanent delete is a **soft-delete**: the profile is marked deleted, the user’s live/pending listings are taken down, and deals/chats are retained for audit.

## Schema

See `supabase/001_schema.sql` and `PLAN.md`. Role checks run in RLS and RPCs (giveaway claims lock the listing so only the first claim succeeds; borrow periods must be at least 5 seconds).
