# Changelog

COMP3111 F2026, Group 34 (Non-Honors). Newest first.

## 2026-11-14 — First-draft Supabase backend (Task 1–3)

This session hooked the existing Figma Make Vite + React UI to Supabase. Official Canvas Task 1–3 only: no extra features, no demo listing/user seed.

### What teammates will notice

- The Figma Make app is now **real source in this repo** (`src/`, `package.json`, Vite config), not only `USTMarketPlace - Figma.make`.
- Login / register / listings / offers / chats / ratings / notifications no longer use in-memory mock data. They read and write **Supabase**.
- Empty marketplace until someone registers and the admin approves listings.
- Admin is **login-only**. There is no admin sign-up screen.

### New / important files

| File | Why it exists |
|---|---|
| `PLAN.md` | Approved Task 1–3 plan and remaining checklist |
| `supabase/001_schema.sql` | Postgres tables, RLS, RPCs, explicit GRANTs — **must be run in the Dashboard** |
| `src/lib/supabase.ts` | Official `@supabase/supabase-js` client |
| `src/lib/api.ts` | Auth + marketplace reads/writes used by the UI |
| `.env.example` | Env var names only (no secrets) |
| `README.md` | Setup, password rules, admin seed steps |

UI still lives mainly in `src/App.tsx` (same screens/CSS). Mock arrays were removed; handlers call `src/lib/api.ts`.

### Backend (schema)

Tables: `profiles`, `listings`, `offers`, `chat_threads`, `chat_messages`, `ratings`, `notifications`, `listing_reports`.

Rules encoded in SQL, not only the UI:

- Unique username across buyer / seller / admin
- Passwords hashed by **Supabase Auth** (never stored in Postgres)
- Role checks via RLS + RPCs (buyer cannot hit seller/admin-only actions)
- Listing **view count** increments when a detail is opened
- Chat history is kept and searchable
- Giveaway **claim**: row lock so only the first claim succeeds
- Borrow period minimum **5 seconds** (for testing); overdue borrows auto-return
- User “permanent delete” is a **soft-delete** (listings taken down; deals/chats kept for audit)

### Auth (how login works)

- Buyer and seller: register + login with **username** + password.
- Confirm-password is **client-side only**.
- Password rules: 8+ characters, one uppercase, one lowercase, one number.
- Username without `@` is stored in Auth as `g34mp+{username}@gmail.com` (`.local` is rejected by Auth MX checks).
- After login, `profiles.role` must match the portal (buyer cannot open seller/admin).
- Admin username: `admin@ust.hk`. Create that Auth user in the dashboard (no password in git).

Env vars (`.env.local`, gitignored):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — **publishable/anon only**. Never put `service_role` / `sb_secret` in the frontend.

### Done after this session

- [x] Applied `supabase/001_schema.sql` in the SQL Editor
- [x] Seeded Auth user `admin@ust.hk` (password kept out of git)

### Admin login stuck on sign-in

Password was accepted. Loading listings/offers then 500’d with `infinite recursion detected in policy for relation "listings"` (listings SELECT peeked at offers, offers SELECT peeked at listings). Sign-in stayed on the form because that snapshot error was an uncaught promise.

- Run `supabase/002_fix_rls_recursion.sql` in the SQL Editor (already-applied `001` is not re-run).
- `001_schema.sql` updated the same way for a clean install.
- Login now awaits the snapshot so a future API error shows on the form.

### Buyer/Seller sign-up 400

Auth returned `email_address_invalid` for `{username}@users.hkust-marketplace.local` (no MX). New sign-ups use `g34mp+{username}@gmail.com`. Turn **Confirm email** off in the Dashboard (SQL cannot add a trigger on `auth.users`). `003` no longer `ALTER`s `auth.users` (that 42501’d).

### Demo seed

Optional SQL `supabase/003_demo_seed.sql` plus `demo/accounts.csv`: 5 sellers, 8 buyers, 19 listings, mixed deal/chat/rating history. Admin password still not in git. Re-run wipes only those 13 demo UUIDs.

### Deploy

- Deleted leftover Figma `pnpm-lock.yaml` so Vercel uses npm + `package-lock.json`.
- Dropped `.figma/` (Figma Make tooling). Slimmed `vite.config.ts` and filled `index.html` so the production build no longer imports it.

### Optional / check

- [x] Authentication → Providers → Email: **Confirm email** off. Dropped unused `004_autoconfirm_signup.sql`.

### What we did *not* do

- No `npm run dev` / `npm run build` / type-check in this session
- No commit, push, or merge
- No mock seed until `003_demo_seed.sql` (run that in the SQL Editor when you want the demo CSV logins)
- No extra npm packages besides `@supabase/supabase-js`
- No service-role key in the app or in git
