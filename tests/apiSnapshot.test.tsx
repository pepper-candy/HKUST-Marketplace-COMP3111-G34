import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const queryResults = new Map<string, { data: any; error: any }>();
  const rpcResults = new Map<string, { data: any; error: any }>();
  const state = {
    user: { id: "buyer-id" } as any,
    session: null as any,
    signUp: { error: null } as any,
    signIn: { error: null } as any,
  };
  const queryResult = (table: string) => queryResults.get(table) ?? { data: [], error: null };
  const from = vi.fn((table: string) => {
    let builder: any;
    builder = new Proxy(
      {},
      {
        get: (_target, method) => {
          if (method === "then") {
            return (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
              Promise.resolve(queryResult(table)).then(resolve, reject);
          }
          if (method === "single" || method === "maybeSingle") {
            return async () => queryResult(table);
          }
          return () => builder;
        },
      },
    );
    return builder;
  });
  const supabase = {
    from,
    rpc: vi.fn(async (name: string) => rpcResults.get(name) ?? { data: null, error: null }),
    auth: {
      getUser: vi.fn(async () => ({ data: { user: state.user }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: state.session }, error: null })),
      signUp: vi.fn(async () => state.signUp),
      signInWithPassword: vi.fn(async () => state.signIn),
      signOut: vi.fn(async () => ({ error: null })),
      updateUser: vi.fn(async () => ({ error: null })),
    },
  };
  return { queryResults, rpcResults, state, supabase };
});

vi.mock("../src/lib/supabase", () => ({ supabase: mocks.supabase }));

import {
  acceptCounterOffer,
  adminDeleteUser,
  adminSetUserStatus,
  buyerCounterOffer,
  buyerDeclineOffer,
  completeDeal,
  createListing,
  declineCounterOffer,
  deleteChatThread,
  hideRating,
  incrementViews,
  loadSnapshot,
  loginAccount,
  markNotificationsRead,
  moderateListing,
  reportListing,
  registerAccount,
  resolveListingReport,
  respondToOffer,
  returnBorrow,
  restoreSession,
  sellerMakeOffer,
  sellerRemoveListing,
  submitListingAction,
  updateListingDetails,
} from "../src/lib/api";

const timestamp = "2026-11-25T01:00:00.000Z";
const profiles = [
  { id: "buyer-id", username: "buyer", full_name: "Buyer Name", role: "buyer", residence: null, bio: null, meetup_locations: null, status: "active" },
  { id: "seller-id", username: "seller", full_name: "Seller Name", role: "seller", residence: "Hall I", bio: "Seller bio", meetup_locations: ["Library"], status: "active" },
  { id: "other-seller", username: "other", full_name: "Other Seller", role: "seller", residence: null, bio: null, meetup_locations: [], status: "deactivated" },
  { id: "deleted-id", username: "deleted", full_name: "Deleted User", role: "buyer", residence: null, bio: null, meetup_locations: null, status: "deleted" },
  { id: "admin-id", username: "admin@ust.hk", full_name: "Admin Name", role: "admin", residence: null, bio: null, meetup_locations: null, status: "active" },
];
const listingRows = [
  ["live", "sell", "15", ["lamp.jpg"]],
  ["pending", "lend", null, null],
  ["rejected", "giveaway", null, ["", "gift.jpg"]],
  ["reserved", "sell", 0, []],
  ["sold", "lend", 25, ["book.jpg"]],
  ["lent", "giveaway", null, ["giveaway.jpg"]],
  ["given", "sell", 40, ["chair.jpg"]],
  ["removed", "sell", null, null],
  ["unexpected", "unexpected", null, []],
].map(([status, listing_type, price, photos], index) => ({
  id: index + 1,
  seller_id: index === 4 ? "other-seller" : "seller-id",
  title: `Listing ${index + 1}`,
  category: "Other",
  listing_type,
  condition: "Used",
  description: "Description",
  price,
  lending_duration_value: index === 1 ? 2 : null,
  lending_duration_unit: index === 1 ? "Weeks" : "unknown",
  meetup_location: "Library",
  photos,
  status,
  rejection_reason: index === 2 ? "Needs changes" : null,
  removed_reason: null,
  view_count: index + 1,
  created_at: timestamp,
  updated_at: timestamp,
}));
listingRows.push({
  id: 10,
  seller_id: "seller-id",
  title: "Listing 10",
  category: "Books",
  listing_type: "sell",
  condition: "New",
  description: "Description",
  price: 10,
  lending_duration_value: null,
  lending_duration_unit: null,
  meetup_location: "North Gate",
  photos: ["ten.jpg"],
  status: "live",
  rejection_reason: null,
  removed_reason: null,
  view_count: 10,
  created_at: timestamp,
  updated_at: timestamp,
});
listingRows.push({
  id: 11,
  seller_id: "seller-id",
  title: "Unreserved live listing",
  category: "Other",
  listing_type: "sell",
  condition: "Good",
  description: "Description",
  price: 30,
  lending_duration_value: null,
  lending_duration_unit: null,
  meetup_location: "Library",
  photos: [],
  status: "live",
  rejection_reason: null,
  removed_reason: null,
  view_count: 0,
  created_at: timestamp,
  updated_at: timestamp,
});
const offer = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  listing_id: 1,
  buyer_id: "buyer-id",
  last_action_by: null,
  kind: "offer",
  status: "pending",
  price: 100,
  start_at: null,
  end_at: null,
  detail: "Proposed price: HK$100",
  completed_at: null,
  created_at: timestamp,
  ...overrides,
});
const offers = [
  offer(101),
  offer(102, { listing_id: 2, kind: "borrow", status: "countered", detail: "Seller proposed new lending dates: new dates" }),
  offer(103, { listing_id: 3, kind: "claim", status: "accepted" }),
  offer(104, { listing_id: 4, status: "completed", completed_at: timestamp }),
  offer(105, { listing_id: 5, kind: "borrow", status: "returned", end_at: timestamp }),
  offer(106, { listing_id: 6, status: "declined" }),
  offer(107, { listing_id: 7, kind: "claim", status: "cancelled" }),
  offer(108, { listing_id: 10, status: "accepted" }),
  offer(109, { listing_id: 999, status: "accepted" }),
  offer(110, { buyer_id: "seller-id", status: "pending" }),
  offer(111, { buyer_id: "other-seller", status: "pending" }),
  offer(112, { buyer_id: "other-seller", status: "accepted", kind: "borrow" }),
  offer(113, { buyer_id: "other-seller", status: "countered", kind: "claim" }),
  offer(114, { buyer_id: "other-seller", status: "declined" }),
  offer(115, { listing_id: 4, buyer_id: "other-seller", status: "pending" }),
  offer(116, { listing_id: 2, buyer_id: "other-seller", status: "pending" }),
  offer(117, { listing_id: 1, buyer_id: "other-seller", last_action_by: "seller", status: "pending" }),
  offer(118, { listing_id: 5, kind: "borrow", status: "accepted" }),
];
const ratings = [
  { id: 201, offer_id: 104, buyer_id: "buyer-id", seller_id: "seller-id", stars: 5, review_text: "Great", seller_reply: "Thanks", replied_at: timestamp, flagged: false, flag_reason: null, hidden: false, created_at: timestamp },
  { id: 202, offer_id: 999, buyer_id: "buyer-id", seller_id: "seller-id", stars: 3, review_text: null, seller_reply: null, replied_at: null, flagged: true, flag_reason: "Spam", hidden: false, created_at: timestamp },
  { id: 203, offer_id: 103, buyer_id: "buyer-id", seller_id: "seller-id", stars: 4, review_text: null, seller_reply: null, replied_at: null, flagged: false, flag_reason: null, hidden: true, created_at: timestamp },
];

function seedSnapshotQueries() {
  mocks.queryResults.set("profiles", { data: profiles, error: null });
  mocks.queryResults.set("listings", { data: listingRows, error: null });
  mocks.queryResults.set("offers", { data: offers, error: null });
  mocks.queryResults.set("ratings", { data: ratings, error: null });
  mocks.queryResults.set("notifications", {
    data: [
      { id: 1, category: "Offer", title: "An offer", message: "Offer received", icon: null, tone: "green", action: null, listing_id: 1, thread_id: null, read_at: timestamp, created_at: timestamp },
      { id: 2, category: "Deal", title: "A deal", message: "Deal updated", icon: "bag", tone: "unknown", action: "View deal", listing_id: null, thread_id: 5, read_at: null, created_at: timestamp },
    ],
    error: null,
  });
  mocks.queryResults.set("chat_messages", {
    data: [
      { offer_id: 101, sender_id: "seller-id" },
      { offer_id: 111, sender_id: "other-seller" },
      { offer_id: 112, sender_id: "buyer-id" },
    ],
    error: null,
  });
  mocks.queryResults.set("listing_reports", {
    data: [
      { id: 1, listing_id: 1, reporter_id: "other-seller", reason: "Concern", resolution: null, resolved_at: null, created_at: timestamp },
      { id: 2, listing_id: 2, reporter_id: "missing", reason: null, resolution: "dismissed", resolved_at: timestamp, created_at: timestamp },
      { id: 3, listing_id: 3, reporter_id: "buyer-id", reason: "Reviewed", resolution: "reviewed", resolved_at: timestamp, created_at: timestamp },
      { id: 4, listing_id: 999, reporter_id: "buyer-id", reason: "Missing listing", resolution: null, resolved_at: null, created_at: timestamp },
    ],
    error: null,
  });
}

beforeEach(() => {
  mocks.queryResults.clear();
  mocks.rpcResults.clear();
  mocks.state.user = { id: "buyer-id" };
  mocks.state.session = null;
  mocks.state.signUp = { error: null };
  mocks.state.signIn = { error: null };
  vi.clearAllMocks();
});

describe("API snapshot and authentication branches", () => {
  test("loadSnapshot maps listing, deal, report, and review variants for a buyer", async () => {
    seedSnapshotQueries();
    const snapshot = await loadSnapshot();

    expect(snapshot.role).toBe("Buyer");
    expect(snapshot.users.map((user) => user.username)).toEqual(["buyer", "seller", "other"]);
    expect(snapshot.liveListings.map((item) => item.title)).toEqual(["Unreserved live listing"]);
    expect(snapshot.listings.map((item) => item.type)).toContain("Give Away");
    expect(snapshot.buyerDeals.map((item) => item.status)).toContain("Borrowed");
    expect(snapshot.buyerDeals.some((item) => item.id === 106 || item.id === 107)).toBe(false);
    expect(snapshot.reviewListings.map((item) => item.status)).toContain("Removed");
    expect(snapshot.listingReports.map((item) => item.status)).toEqual(["Pending", "Closed", "Closed"]);
    expect(snapshot.sellerReviews.find((item) => item.id === 202)).toMatchObject({
      listing: { title: "Completed deal" },
      flagReason: "Spam",
    });
    expect(snapshot.systemDeals.map((item) => item.status)).toContain("Returned");
    expect(snapshot.readNotificationIds).toEqual([1]);
    expect(snapshot.historyDeals.map((item) => item.type)).toContain("Borrowed");
    expect(snapshot.adminProfile.fullName).toBe("Admin Name");
  });

  test("loadSnapshot builds seller requests and stats from owned listings", async () => {
    seedSnapshotQueries();
    mocks.state.user = { id: "seller-id" };

    const snapshot = await loadSnapshot();

    expect(snapshot.role).toBe("Seller");
    expect(snapshot.sellerRequests.map((item) => item.id)).toContain(117);
    expect(snapshot.sellerRequests.some((item) => item.id === 110 || item.id === 116)).toBe(false);
    expect(snapshot.sellerListingRecords.map((item) => item.status)).toContain("Given");
    expect(snapshot.sellerListingRecords.some((item) => item.status === "Removed")).toBe(false);
    expect(snapshot.sellerStats).toMatchObject({ views: 50, offers: 15, completed: 1 });
    expect(snapshot.sellerRatings.find((item) => item.seller === "seller")).toMatchObject({
      average: 4,
      reviews: 2,
    });
  });

  test("loadSnapshot reports missing authentication, profiles, and query errors", async () => {
    mocks.state.user = null;
    await expect(loadSnapshot()).rejects.toThrow("Not signed in.");

    mocks.state.user = { id: "buyer-id" };
    mocks.queryResults.set("profiles", { data: [], error: null });
    await expect(loadSnapshot()).rejects.toThrow("Profile was not found");

    mocks.queryResults.set("profiles", { data: null, error: { message: "query failed" } });
    await expect(loadSnapshot()).rejects.toThrow("query failed");
  });

  test("registerAccount rejects reserved and duplicate names and translates invalid email errors", async () => {
    await expect(
      registerAccount({ username: "admin@ust.hk", fullName: "Admin", password: "Abcd1234", role: "Buyer" }),
    ).rejects.toThrow("reserved");

    mocks.rpcResults.set("resolve_login_email", { data: "already-used@example.com", error: null });
    await expect(
      registerAccount({ username: "Alice", fullName: "Alice", password: "Abcd1234", role: "Buyer" }),
    ).rejects.toThrow("already used");

    mocks.rpcResults.set("resolve_login_email", { data: null, error: null });
    mocks.state.signUp = { error: { code: "email_address_invalid", message: "Invalid address" } };
    await expect(
      registerAccount({ username: "Alice", fullName: "Alice", password: "Abcd1234", role: "Buyer" }),
    ).rejects.toThrow("username without @");
  });

  test("loginAccount handles lookup failures, invalid credentials, and role mismatch", async () => {
    mocks.rpcResults.set("resolve_login_email", { data: null, error: null });
    await expect(
      loginAccount({ username: "unknown", password: "x", expectedRole: "Buyer" }),
    ).rejects.toThrow("No account matches");

    mocks.rpcResults.set("resolve_login_email", { data: "buyer@example.com", error: null });
    mocks.state.signIn = { error: { message: "bad password" } };
    await expect(
      loginAccount({ username: "buyer", password: "x", expectedRole: "Admin" }),
    ).rejects.toThrow("Invalid admin credentials");

    mocks.state.signIn = { error: null };
    mocks.state.user = { id: "buyer-id" };
    mocks.queryResults.set("profiles", {
      data: { id: "buyer-id", username: "buyer", role: "buyer", status: "active" },
      error: null,
    });
    await expect(
      loginAccount({ username: "buyer", password: "x", expectedRole: "Seller" }),
    ).rejects.toThrow("Wrong role selected");
  });

  test("restoreSession returns null without a session and signs out inactive profiles", async () => {
    expect(await restoreSession()).toBeNull();

    mocks.state.session = { user: { id: "buyer-id" } };
    mocks.queryResults.set("profiles", {
      data: { id: "buyer-id", username: "buyer", role: "buyer", status: "deactivated" },
      error: null,
    });
    expect(await restoreSession()).toBeNull();
    expect(mocks.supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  test("listing APIs cover auth guards, listing types, and legacy RPC fallbacks", async () => {
    mocks.state.user = null;
    await expect(
      createListing({
        type: "Sell",
        title: "Lamp",
        category: "Other",
        condition: "Good",
        description: "Desk lamp",
        location: "Library",
        price: 10,
        photos: [],
      }),
    ).rejects.toThrow("Not signed in");

    mocks.state.user = { id: "seller-id" };
    await createListing({
      type: "Sell",
      title: " Lamp ",
      category: "Other",
      condition: "Good",
      description: " Lamp ",
      location: "Library",
      price: 10,
      photos: ["one.jpg", "two.jpg"],
      goLive: true,
    });
    await createListing({
      type: "Lend",
      title: "Book",
      category: "Books",
      condition: "Good",
      description: "Book",
      location: "Library",
      duration: 2,
      durationUnit: "Weeks",
      photos: [],
    });
    await createListing({
      type: "Give Away",
      title: "Box",
      category: "Other",
      condition: "Used",
      description: "Box",
      location: "Library",
      photos: [],
    });
    expect(mocks.supabase.from).toHaveBeenCalledWith("listings");

    mocks.rpcResults.set("claim_giveaway", { data: 12, error: null });
    expect(await submitListingAction({ ...listingForTest(1), type: "Give Away" }, {})).toBe(12);
    mocks.rpcResults.set("create_offer", { data: 13, error: null });
    expect(await submitListingAction(listingForTest(2), { price: 50 })).toBe(13);
    expect(
      await submitListingAction(
        { ...listingForTest(3), type: "Lend" },
        { start: "2099-01-01T10:00", end: "2099-01-01T11:00" },
      ),
    ).toBe(13);

    mocks.rpcResults.set("seller_make_offer_after_decline", {
      data: null,
      error: { code: "PGRST202", message: "function missing from schema cache" },
    });
    await sellerMakeOffer(20, { price: 40 });
    mocks.rpcResults.set("buyer_counter_offer", {
      data: null,
      error: { code: "PGRST202", message: "function missing" },
    });
    mocks.queryResults.set("offers", { data: { listing_id: 31, kind: "borrow" }, error: null });
    await buyerCounterOffer(21, { start: "2099-01-01T10:00", end: "2099-01-01T11:00" });
  });

  test("listing updates handle optional fields and absent notification RPCs", async () => {
    mocks.rpcResults.set("notify_active_offer_buyers_of_listing_edit", { data: "3", error: null });
    expect(
      await updateListingDetails(2, {
        title: " Updated ",
        category: "Other",
        condition: "Good",
        location: "Library",
        description: " Updated ",
        photos: Array.from({ length: 8 }, (_, index) => `${index}.jpg`),
        resubmit: true,
      }),
    ).toBe(3);

    mocks.rpcResults.set("notify_active_offer_buyers_of_listing_edit", {
      data: null,
      error: { code: "PGRST202", message: "function missing" },
    });
    expect(
      await updateListingDetails(3, {
        title: "Title",
        category: "Other",
        condition: "Used",
        location: "Library",
        description: "Description",
      }),
    ).toBe(0);

    mocks.rpcResults.set("notify_active_offer_buyers_of_listing_edit", {
      data: null,
      error: { message: "permission denied" },
    });
    await expect(
      updateListingDetails(4, {
        title: "Title",
        category: "Other",
        condition: "Used",
        location: "Library",
        description: "Description",
      }),
    ).rejects.toThrow("permission denied");
  });

  test("incrementViews enforces its cooldown and retries after RPC failure", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(50_000);
    mocks.rpcResults.set("increment_listing_views", { data: 7, error: null });
    expect(await incrementViews(98765)).toBe(7);
    expect(await incrementViews(98765)).toBeNull();

    now.mockReturnValue(52_001);
    mocks.rpcResults.set("increment_listing_views", {
      data: null,
      error: { message: "temporarily unavailable" },
    });
    expect(await incrementViews(98765)).toBeNull();

    mocks.rpcResults.set("increment_listing_views", { data: 9, error: null });
    expect(await incrementViews(98765)).toBe(9);
  });

  test("simple RPC actions propagate errors and accept missing hide-thread RPCs", async () => {
    const actions = [
      ["accept_counter_offer", () => acceptCounterOffer(1)],
      ["respond_to_offer", () => respondToOffer(1, "accept")],
      ["decline_counter_offer", () => declineCounterOffer(1)],
      ["buyer_decline_offer", () => buyerDeclineOffer(1)],
      ["return_borrow", () => returnBorrow(1)],
      ["complete_deal", () => completeDeal(1)],
      ["moderate_listing", () => moderateListing(1, "approve")],
      ["seller_remove_listing", () => sellerRemoveListing(1)],
      ["set_user_status", () => adminSetUserStatus("user", "active")],
      ["soft_delete_user", () => adminDeleteUser("user")],
      ["report_listing", () => reportListing(1)],
      ["resolve_listing_report", () => resolveListingReport(1, "reviewed")],
      ["hide_rating", () => hideRating(1)],
      ["mark_notifications_read", () => markNotificationsRead([1])],
    ] as const;

    for (const [rpcName, action] of actions) {
      await action();
      mocks.rpcResults.set(rpcName, { data: null, error: { message: `${rpcName} failed` } });
      await expect(action()).rejects.toThrow(`${rpcName} failed`);
      mocks.rpcResults.delete(rpcName);
    }

    mocks.rpcResults.set("hide_chat_thread", {
      data: null,
      error: { code: "PGRST202", message: "function missing from schema cache" },
    });
    await expect(deleteChatThread(42)).resolves.toBeUndefined();
  });

  test("registration and login complete successful account flows", async () => {
    mocks.rpcResults.set("resolve_login_email", { data: null, error: null });
    await registerAccount({
      username: " Alice ",
      fullName: " Alice Chan ",
      password: "Abcd1234",
      role: "Seller",
      meetups: ["Library"],
    });
    expect(mocks.supabase.auth.signOut).toHaveBeenCalledOnce();

    mocks.rpcResults.set("resolve_login_email", { data: "alice@example.com", error: null });
    mocks.state.signIn = { error: null };
    mocks.state.user = { id: "seller-id" };
    mocks.queryResults.set("profiles", {
      data: { id: "seller-id", username: "alice", role: "seller", status: "active" },
      error: null,
    });
    await expect(
      loginAccount({ username: "Alice", password: "Abcd1234", expectedRole: "Seller" }),
    ).resolves.toEqual({ role: "Seller", username: "alice" });
  });
});

function listingForTest(id: number) {
  return {
    id,
    title: "Listing",
    seller: "seller",
    category: "Other",
    type: "Sell" as const,
    condition: "Good",
    location: "Library",
    posted: "Today",
    image: "",
    description: "Description",
  };
}
