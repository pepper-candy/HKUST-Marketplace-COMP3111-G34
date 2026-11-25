import { describe, expect, test } from "vitest";
import {
  chatTargetFromNotification,
  listingFromNotification,
  pageForNotificationAction,
  usernameFromNotification,
} from "../src/App";
import type {
  BuyerDeal,
  Listing,
  NotificationItem,
  SellerRequest,
} from "../src/lib/api";

const listing: Listing = {
  id: 11,
  title: "Desk lamp",
  seller: "seller1",
  category: "Furniture & Home",
  type: "Sell",
  price: 100,
  condition: "Good",
  location: "Library",
  posted: "Today",
  image: "",
  description: "A desk lamp",
};

function notification(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 1,
    category: "Offer",
    title: "New offer",
    message: "An offer was submitted.",
    timestamp: "Today",
    dateGroup: "Today",
    icon: "bell",
    tone: "navy",
    ...overrides,
  };
}

describe("App notification helpers", () => {
  test("listingFromNotification matches quoted titles and unquoted mentions", () => {
    expect(listingFromNotification('Offer received for “Desk lamp”', [listing])).toBe(listing);
    expect(listingFromNotification("A buyer asked about Desk lamp today", [listing])).toBe(listing);
    expect(listingFromNotification("No listing mentioned", [listing])).toBeUndefined();
  });

  test("usernameFromNotification resolves known names and extracts unknown names", () => {
    expect(usernameFromNotification(notification({ title: "Offer from @alice" }), ["Alice"])).toBe("Alice");
    expect(
      usernameFromNotification(
        notification({ message: "@buyer.name offered on your listing" }),
        ["buyer.name"],
      ),
    ).toBe("buyer.name");
    expect(usernameFromNotification(notification())).toBeUndefined();
  });

  test("chatTargetFromNotification uses the exact listing and matched seller request", () => {
    const request: SellerRequest = {
      id: 1,
      dealId: 1,
      listing,
      buyer: "Alice",
      lastActionBy: "buyer",
      type: "Offer",
      submitted: "Today",
      detail: "Offer: HK$100",
      status: "Pending",
      listingStatus: "Available",
    };
    expect(
      chatTargetFromNotification(
        notification({ title: "Offer from @alice", listingId: listing.id }),
        "Seller",
        [listing],
        [request],
        [],
      ),
    ).toEqual({ listing, participant: "Alice" });
  });

  test("chatTargetFromNotification resolves buyer deals and returns null when unmatched", () => {
    const deal: BuyerDeal = {
      id: 2,
      listing,
      kind: "Offer",
      status: "Pending",
      date: "Today",
      detail: "Offer: HK$100",
    };
    expect(
      chatTargetFromNotification(
        notification({ title: 'Offer for "Desk lamp" from @seller1' }),
        "Buyer",
        [listing],
        [],
        [deal],
      ),
    ).toEqual({ listing });
    expect(chatTargetFromNotification(notification(), "Admin", [], [], [])).toBeNull();
  });

  test("pageForNotificationAction maps actions by role and ignores unknown actions", () => {
    expect(pageForNotificationAction("Review listing", "Admin")).toBe("Listing Review");
    expect(pageForNotificationAction("View listing", "Buyer")).toBe("Browse");
    expect(pageForNotificationAction("Review request", "Seller")).toBe("Offers / Requests");
    expect(pageForNotificationAction("View rating", "Buyer")).toBe("Rate Sellers");
    expect(pageForNotificationAction("View users", "Admin")).toBe("All Users");
    expect(pageForNotificationAction("Unknown action", "Buyer")).toBeNull();
  });
});
