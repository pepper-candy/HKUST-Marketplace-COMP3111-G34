# HKUST Marketplace

COMP3111 F2026, Group 34 (Non-Honors). Buyer, seller, and admin portals from the Canvas Task 1–3 spec, backed by Supabase Auth + Postgres.

## Password strength rules

Registration and profile password updates require all of:

- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number

Confirm-password is checked only in the browser. Passwords are hashed by Supabase Auth. The real admin password is not in git. Shared **demo** student passwords are in `demo/accounts.csv` (course demo only).

## Setup

1. Install dependencies (`npm install`). Use npm only — do not add a `pnpm-lock.yaml` (Vercel will pick pnpm and CI will fail).
2. Copy `.env.example` to `.env.local` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable / anon key only — never a `service_role` / `sb_secret` key)
3. Apply the schema: Supabase Dashboard → **SQL Editor** → paste `supabase/001_schema.sql` → **Run**.
4. If `001` was already applied before the listings/offers RLS fix, also run `supabase/002_fix_rls_recursion.sql` (do **not** re-run `001`).
5. Seed the admin Auth user (see below).
6. In Authentication → Providers → Email, turn **off** “Confirm email” so Buyer/Seller registration can sign in immediately.
7. Start the app with `npm run dev`.

Sign-up does **not** use a real inbox. Usernames become Auth emails `g34mp+{username}@gmail.com` (Supabase rejects `.local` addresses with `email_address_invalid`). Login is still **username + password** on the matching Buyer/Seller portal.

## Seed the admin account

Admin has **no** public registration screen. Create the user in the dashboard (do not put the password in git):

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**.
2. Email: `admin@ust.hk`
3. Set a strong password and keep it only in your password manager / demo notes.
4. Enable **Auto Confirm User**.
5. Save. A database trigger creates `profiles.role = admin` for this email.

Sign in through **Admin Login** with username `admin@ust.hk` and that dashboard password.

## Demo seed (buyers, sellers, listings)

For a graded demo the marketplace should not be empty. After `001` (and `002` if you already applied `001` before the RLS fix):

1. SQL Editor → paste `supabase/003_demo_seed.sql` → **Run**. Safe to re-run; it only replaces the 13 demo accounts.
2. If `003` was already applied with SVG placeholders, run `supabase/005_demo_listing_photos.sql` (do **not** re-run `003`). Listing photos are the Figma Make Unsplash URLs — the export had no product files in `src/` or `public/`.
3. After photos are in, run `supabase/006_demo_match_photos_and_listings.sql`, then `supabase/007_fix_broken_and_follow_photos.sql` (do **not** re-run `003` / `005` / `006`). `007` replaces Unsplash IDs that 404 and adds extra listings whose copy follows the photo.
4. Listing photo uploads: SQL Editor → paste `supabase/008_listing_photos_storage.sql` → **Run** (do **not** re-run `001`). Then confirm **Storage → listing-photos** is **Public**. New Create/Edit photos are compressed in the browser and stored as public URLs; existing Unsplash demo URLs stay.
5. Live chat + notifications: SQL Editor → paste `supabase/009_realtime_chat_notifications.sql` → **Run** (do **not** re-run `001`). Enable Realtime in the Dashboard if `supabase_realtime` is off.
6. One offer per buyer+listing (listing detail and chat Make Offer share the same row): SQL Editor → paste `supabase/010_unify_offers.sql` → **Run** (do **not** re-run `001`).
7. Buyer acceptance of seller counters and buyer decline of seller counters: SQL Editor → paste `supabase/011_buyer_decline_counter.sql` → **Run** (do **not** re-run `001`).
8. Buyer empty-chat welcome + listing terms: SQL Editor → paste `supabase/012_buyer_chat_welcome.sql` → **Run** (do **not** re-run `001`).
9. Live offers + notifications (Browse stays manual): SQL Editor → paste `supabase/013_realtime_offers.sql` → **Run** (do **not** re-run `001`). Enable Realtime in the Dashboard if `supabase_realtime` is off. Do **not** add `listings` to the publication.
10. Completed deals hide listings: SQL Editor → paste `supabase/013_completed_deals_hide_listings.sql` → **Run** (do **not** re-run `001`).
11. Direct fixed-price purchases: SQL Editor → paste `supabase/014_direct_listing_purchase.sql` → **Run** (do **not** re-run `001`). This enables **Buy now**, which accepts the seller’s listed price and completes the sale immediately.
12. Log in from `demo/accounts.csv`. Use the **Buyer** or **Seller** portal that matches the row. Usernames have no `@` except admin.

Counts (meant to look like a couple of weeks on campus, not a full year):

| | Count | Why |
|---|---|---|
| Sellers | 5 | Textbooks, electronics, dorm, fashion, outdoors — every listing type |
| Buyers | 8 | Mix of halls + one off-campus; one almost-new account (`hana.kim`) |
| Listings | 19 | Live browse, 2 pending (admin), 1 rejected, 2 sold, 1 reserved, 1 lent, 1 given, 1 reportable scam, live giveaway to claim |
| Deals | 12 | Completed / pending / countered / declined / active borrow / returned |
| Chats | 4 threads | Including searchable “solution sketches” |
| Ratings | 4 | 5★ with reply, 4★, returned-borrow 5★, flagged 2★ |

Suggested live path: admin approves the fridge + MATH notes → buyer `jason.ng` claims the tote giveaway → seller `sofiapeng` accepts `hana.kim`’s monitor-arm borrow.

## User deletion

Permanent delete is a **soft-delete**: the profile is marked deleted, the user’s live/pending listings are taken down, and deals/chats are retained for audit.

## Schema

See `supabase/001_schema.sql` and `PLAN.md`. Role checks run in RLS and RPCs (giveaway claims lock the listing so only the first claim succeeds; borrow periods must be at least 5 seconds).
