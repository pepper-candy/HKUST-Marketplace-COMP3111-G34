# HKUST Marketplace — Task 1–3 Supabase plan

COMP3111 F2026, Group 34, Non-Honors. Source of truth: `F2026 Project Tasks - HKUST Canvas.md`.

## Status

- [x] Plan approved (no mock seed; publishable/anon key in `.env.local`; old secret rotated)
- [x] Unpack Figma Make Vite + React + TypeScript UI into this repo
- [x] `PLAN.md` tracker
- [x] `supabase/001_schema.sql` (tables, RLS, RPCs, explicit GRANTs)
- [x] Official `@supabase/supabase-js` client (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` only)
- [x] Replace in-memory/mock data with Supabase reads/writes (keep existing UI)
- [x] README + `.env.example` (setup, password rules, admin seed steps)
- [x] Apply SQL in the Supabase Dashboard SQL Editor
- [x] Seed `admin@ust.hk` in Authentication → Users (password not stored in the repo)

## Constraints

- First draft: official Task 1–3 only — no extras, no demo listing/user seed.
- Never put `service_role` / `sb_secret` in the frontend or git.
- Passwords hashed by Supabase Auth, never stored plaintext.
- Confirm-password is client-side only.
- Username unique across buyer, seller, and admin.
- Admin is login-only; seed `admin@ust.hk` in the dashboard (no password in repo).
- Role-based access enforced with RLS (and RPCs), not only the UI.
- Auto-expose new tables is off → grant `anon` / `authenticated` explicitly.
- Listing view counts; retained searchable chat; concurrent giveaway claims (first wins); 5-second minimum borrow time.
- Soft-delete users: listings taken down; deals and chats kept for audit.

## Schema

| Table | Purpose |
|---|---|
| `profiles` | `id` = `auth.users.id`; unique username; full name; role; buyer residence; seller bio + meetup locations; status; `deleted_at` |
| `listings` | seller, type, category, condition, description, price, lending duration, meetup, photos (max 6), status, rejection/removal reasons, `view_count` |
| `offers` | sell offer / borrow request / giveaway claim; 5s min lend duration |
| `chat_threads` | one thread per listing + buyer |
| `chat_messages` | retained body; searchable |
| `ratings` | 1–5 + text; one per completed deal; seller reply; flag; admin hide |
| `notifications` | per-user, categorized, timestamped, read state |
| `listing_reports` | Report Listing → admin moderation |

RPCs: `resolve_login_email`, `increment_listing_views`, `submit_offer`, `submit_borrow`, `claim_giveaway`, `respond_to_offer`, `expire_overdue_borrows`, `complete_deal`, `return_borrow`, `take_down_listing`, `soft_delete_user`, plus notification helpers.

## Auth

- Buyer/seller register + login. Auth email is the username if it contains `@`, otherwise `{username}@users.hkust-marketplace.local`.
- Login: RPC resolves email → `signInWithPassword` → profile role must match the portal.
- Admin: no public sign-up. Dashboard user `admin@ust.hk`; trigger sets `role = admin`.
- Password rules (UI + README): 8+ characters, one uppercase, one lowercase, one number.

## UI data switched off mocks

Register/login/logout, profile + password, create/edit/delete listings, admin approve/reject/take-down/add-on-behalf, browse/search/filter/sort, view-count on detail open, offer/borrow/claim, chats + search, my deals (return / auto-return / complete), ratings, notifications, user deactivate/delete, seller stats from aggregates.

Photos persist as data URLs in `listings.photos` (no Storage package).

## Apply SQL

Done: schema run in the Dashboard SQL Editor; admin Auth user `admin@ust.hk` created (see README for sign-in). Password is not in this repo.
