# HKUST Marketplace

COMP3111 F2026, Group 34 (Non-Honors). Buyer, seller, and admin portals from the Canvas Task 1–3 spec, backed by Supabase Auth + Postgres.

## Password strength rules

Registration and profile password updates require all of:

- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number

Confirm-password is checked only in the browser. Passwords are hashed by Supabase Auth. The real admin password is not in git. Shared **demo** student passwords are in `demo/accounts.csv` (course demo only).

## App env

1. Install dependencies (`npm install`). Use npm only — do not add a `pnpm-lock.yaml` (Vercel will pick pnpm and CI will fail).
2. Copy `.env.example` to `.env.local` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable / anon key only — never a `service_role` / `sb_secret` key)
3. Start the app with `npm run dev` after the database steps below.

Sign-up does **not** use a real inbox. Usernames become Auth emails `g34mp+{username}@gmail.com` (Supabase rejects `.local` addresses with `email_address_invalid`). Login is still **username + password** on the matching Buyer/Seller portal.

---

## New empty project (no demo accounts)

This is the path for a **brand-new** Supabase project with no marketplace tables yet. Buyers and sellers register in the app; you do not seed `demo/accounts.csv`.

**One SQL file:** paste `supabase/000_init.sql` once. Do not also paste `001`–`026`.

1. Supabase Dashboard → **SQL Editor** → New query → paste **all** of `supabase/000_init.sql` → **Run**.
2. Seed the admin Auth user (see [Seed the admin account](#seed-the-admin-account) below).
3. Authentication → Providers → Email → turn **off** “Confirm email” so Buyer/Seller registration can sign in immediately.
4. Storage → **listing-photos** → confirm the bucket is **Public** (the SQL creates it public; check if the dashboard still shows it private).
5. Database → **Publications** → `supabase_realtime` **ON**. Tables `notifications`, `chat_messages`, and `offers` are added by `000_init.sql`. Do **not** add `listings` (Browse stays a manual refresh).
6. `npm run dev`. Register a seller and a buyer in the app, then approve listings from **Admin Login**.

`000_init.sql` is schema + RPCs + Storage + Realtime only. It does **not** create student Auth users or listings.

Do **not** run `000_init.sql` on a database that already has `001` (or later) applied. That file creates tables from scratch and will fail or duplicate objects.

### Optional demo data after a fresh `000_init.sql`

Only if you want the graded demo catalog. Run these **after** `000_init.sql`, in order. Do **not** re-run `000_init.sql` or `008`–`026`.

1. `supabase/003_demo_seed.sql` — 13 demo Auth users + listings/deals (safe to re-run; replaces those 13 accounts only).
2. `supabase/005_demo_listing_photos.sql` — Unsplash URLs on those listings (do not re-run `003`).
3. `supabase/006_demo_match_photos_and_listings.sql`
4. `supabase/007_fix_broken_and_follow_photos.sql` (do not re-run `003` / `005` / `006`).

Then log in from `demo/accounts.csv` on the **Buyer** or **Seller** portal that matches the row. Usernames have no `@` except admin.

---

## Already-running project (do not use `000_init.sql`)

If this Supabase project already ran `001` (typical teammate / existing demo DB), **skip `000_init.sql`**. Apply only the files you have not run yet, in the SQL Editor, without re-running `001`.

| If you last ran… | Run next (in order) |
|---|---|
| `001` only (before the listings/offers RLS fix) | `002_fix_rls_recursion.sql`, then the later files below as needed |
| Through `013` (either `013_*.sql`) | `014_direct_listing_purchase.sql` → `015_to_025_apply.sql` → `026_canvas_gaps.sql` → `027_reason_not_empty.sql` → `028_canvas_deal_flow.sql` → `029_borrow_start_not_past.sql` → `030_borrow_max_duration.sql` → `031_report_includes_reason.sql` |
| Through `014` | `015_to_025_apply.sql` → `026_canvas_gaps.sql` → `027_reason_not_empty.sql` → `028_canvas_deal_flow.sql` → `029_borrow_start_not_past.sql` → `030_borrow_max_duration.sql` → `031_report_includes_reason.sql` |
| Combined `015_to_025_apply.sql` | `026_canvas_gaps.sql` → `027_reason_not_empty.sql` → `028_canvas_deal_flow.sql` → `029_borrow_start_not_past.sql` → `030_borrow_max_duration.sql` → `031_report_includes_reason.sql` |
| `026_canvas_gaps.sql` | `027_reason_not_empty.sql` → `028_canvas_deal_flow.sql` → `029_borrow_start_not_past.sql` → `030_borrow_max_duration.sql` → `031_report_includes_reason.sql` |
| `027_reason_not_empty.sql` | `028_canvas_deal_flow.sql` → `029_borrow_start_not_past.sql` → `030_borrow_max_duration.sql` → `031_report_includes_reason.sql` |
| `028_canvas_deal_flow.sql` | `029_borrow_start_not_past.sql` → `030_borrow_max_duration.sql` → `031_report_includes_reason.sql` |
| `029_borrow_start_not_past.sql` | `030_borrow_max_duration.sql` → `031_report_includes_reason.sql` |
| `030_borrow_max_duration.sql` | `031_report_includes_reason.sql` |
| `031_report_includes_reason.sql` | Nothing else |

`002` is already folded into current `001` and into `000_init.sql`. Do not re-run `001`. Do not re-run `012` on a live DB that already has later `respond_to_offer` / auto-complete (it would undo those).

`015_to_025_apply.sql` is the combined paste of `015`–`025` (latest `respond_to_offer` wins). Prefer it over running each `015`–`025` file one by one.

---

## Seed the admin account

Admin has **no** public registration screen. Create the user in the dashboard (do not put the password in git):

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**.
2. Email: `admin@ust.hk`
3. Set a strong password and keep it only in your password manager / demo notes.
4. Enable **Auto Confirm User**.
5. Save. A database trigger creates `profiles.role = admin` for this email.

Sign in through **Admin Login** with username `admin@ust.hk` and that dashboard password.

---

## Demo catalog (what `003`–`007` add)

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

---

## Incremental SQL files

Numbered files under `supabase/` are the source patches. `000_init.sql` concatenates the non-demo ones for a new empty project (`001`, `008`–`014`, `015_to_025_apply`, `026`–`031`). Skip `002` (already in `001`), and skip `003` / `005` / `006` / `007` unless you want demo accounts.

| File | When |
|---|---|
| `000_init.sql` | **New empty project only** — one paste, no demo users |
| `001_schema.sql` | Original core tables, RLS, RPCs (do not re-run) |
| `002_fix_rls_recursion.sql` | Only if `001` was applied before the RLS fix |
| `003` + `005`–`007` | Optional demo Auth users and listing photos |
| `008_listing_photos_storage.sql` | Listing photo Storage bucket |
| `009` + `013_realtime_offers.sql` | Realtime notifications, chat, offers |
| `010_unify_offers.sql` | One open offer per buyer+listing |
| `011_buyer_decline_counter.sql` | Buyer decline of seller counters |
| `012_buyer_chat_welcome.sql` | Buyer empty-chat welcome |
| `013_completed_deals_hide_listings.sql` | Completed deals hide listings |
| `014_direct_listing_purchase.sql` | **Buy now** / accept listed price |
| `015_to_025_apply.sql` | Chat hide, counters, auto-complete, notify targets, turn owner |
| `026_canvas_gaps.sql` | Seller-reply notify, listing-edit notify, borrow due reminder, hide-chat RPCs |
| `027_reason_not_empty.sql` | Reject/take-down reason is written and non-empty (no 10-character floor) |
| `028_canvas_deal_flow.sql` | Giveaway first-claim-wins; sell/lend Accept reserves; buyer marks complete then rates |
| `029_borrow_start_not_past.sql` | Borrow start cannot be in the past; end at least 5 seconds after start |
| `030_borrow_max_duration.sql` | Borrow request cannot exceed the listing lending duration |
| `031_report_includes_reason.sql` | Admin report notification includes the written report reason |

To rebuild `000_init.sql` after editing those sources: `node supabase/_build_000_init.mjs`.

## User deletion

Permanent delete is a **soft-delete**: the profile is marked deleted, the user’s live/pending listings are taken down, and deals/chats are retained for audit.

## Schema

See `supabase/000_init.sql` (fresh) or the numbered files and `PLAN.md`. Role checks run in RLS and RPCs (giveaway claims lock the listing so only the first claim succeeds; borrow periods must be at least 5 seconds). Chat hide is per-user (`hide_chat_thread`); messages stay in the database.
