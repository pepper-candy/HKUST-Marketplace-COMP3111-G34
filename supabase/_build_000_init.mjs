import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const files = [
  ["001_schema.sql", "Core tables, RLS, RPCs"],
  ["008_listing_photos_storage.sql", "Listing photo Storage bucket"],
  ["009_realtime_chat_notifications.sql", "Realtime: notifications + chat_messages"],
  ["010_unify_offers.sql", "One open offer per buyer+listing"],
  ["011_buyer_decline_counter.sql", "Buyer decline seller counter"],
  ["012_buyer_chat_welcome.sql", "Buyer chat welcome (later files refine notify/open_chat)"],
  ["013_realtime_offers.sql", "Realtime: offers"],
  ["013_completed_deals_hide_listings.sql", "Completed deals hide listings"],
  ["014_direct_listing_purchase.sql", "Buy now / accept listed price"],
  ["015_to_025_apply.sql", "Chat hide, counters, auto-complete, notify targets, turn owner"],
  ["026_canvas_gaps.sql", "Canvas gaps: reply notify, due reminder, listing-edit notify"],
  ["027_reason_not_empty.sql", "Reject/take-down reason: trim-not-empty only"],
  ["028_canvas_deal_flow.sql", "Giveaway first-claim-wins; reserved until buyer marks complete"],
  ["029_borrow_start_not_past.sql", "Borrow start cannot be in the past; 5-second minimum"],
  ["030_borrow_max_duration.sql", "Borrow request cannot exceed listing lending duration"],
  ["031_report_includes_reason.sql", "Report reason in notify; dismiss report does not pull listing back"],
];

function stripTx(sql) {
  return sql.replace(/^[ \t]*(BEGIN|COMMIT);[ \t]*\r?$/gim, "").replace(/\n{3,}/g, "\n\n");
}

const parts = [];
parts.push(`-- HKUST Marketplace — fresh empty database (no demo accounts)
-- Supabase Dashboard → SQL Editor → paste this whole file → Run.
-- Do not run this on a database that already has 001–031 applied.
-- Do not include service_role / sb_secret keys in the app or in git.
--
-- After this file:
-- 1. Authentication → Users → Add user email admin@ust.hk (Auto Confirm)
-- 2. Authentication → Providers → Email → Confirm email OFF
-- 3. Storage → listing-photos → Public
-- 4. Database → Publications → supabase_realtime ON (do not add listings)
-- 5. npm run dev and register buyers/sellers in the app
--
-- Optional demo data (not in this file): 003, 005, 006, 007.

BEGIN;
`);

for (const [file, label] of files) {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  parts.push(`-- =============================================================================
-- ${file} — ${label}
-- =============================================================================
`);
  parts.push(stripTx(raw).trim());
  parts.push("");
}

parts.push(`
GRANT EXECUTE ON FUNCTION public.decline_counter_offer(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_listing_price(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_chat_thread(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_chat_thread(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buyer_counter_offer(bigint, numeric, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seller_make_offer_after_decline(bigint, numeric, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buyer_decline_offer(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_active_offer_buyers_of_listing_edit(bigint) TO authenticated;

COMMIT;
`);

const out = path.join(dir, "000_init.sql");
fs.writeFileSync(out, parts.join("\n") + "\n", "utf8");
const text = fs.readFileSync(out, "utf8");
console.log("wrote", out);
console.log("bytes=" + Buffer.byteLength(text));
console.log("lines=" + text.split("\n").length);
console.log("begins=" + (text.match(/^[ \t]*BEGIN;/gm) || []).length);
console.log("commits=" + (text.match(/^[ \t]*COMMIT;/gm) || []).length);
