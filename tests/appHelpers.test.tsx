import { describe, expect, test } from "vitest";
import {
  avatarInitials,
  chatOffersForListing,
  dealsDonutBackground,
  isInitialOfferBubble,
  isUsableListingPhoto,
  latestOffersByBuyer,
  mergeListingOffers,
  syncChatOfferStatuses,
  withListingChatPeople,
} from "../src/App";

describe("App helper functions", () => {
  test("isInitialOfferBubble identifies the first matching offer", () => {
    const messages = [
      { id: 1, sender: "buyer" as const, body: "old", time: "", kind: "offer" as const, offerId: 4 },
      { id: 2, sender: "seller" as const, body: "new", time: "", kind: "offer" as const, offerId: 4 },
    ];
    expect(isInitialOfferBubble(messages[0], messages)).toBe(true);
    expect(isInitialOfferBubble(messages[1], messages)).toBe(false);
  });

  test("syncChatOfferStatuses updates changed offer statuses only", () => {
    const current = {
      1: [{ id: 1, sender: "buyer" as const, body: "Offer", time: "", kind: "offer" as const, offerId: 7, offerStatus: "Pending" as const }],
    };
    const result = syncChatOfferStatuses(
      current,
      [{ id: 7, status: "Accepted" }] as any,
      [],
    );
    expect(result[1][0].offerStatus).toBe("Accepted");
    const unchanged = syncChatOfferStatuses(current, [], []);
    expect(unchanged).toBe(current);
    const noOfferId = { 1: [{ ...current[1][0], offerId: undefined }] };
    expect(syncChatOfferStatuses(noOfferId, [], [{ id: 8, status: "unmapped" }] as any)).toBe(
      noOfferId,
    );
  });

  test("latestOffersByBuyer and mergeListingOffers retain latest buyer entries", () => {
    const offers = [
      { id: 1, buyer: " Alice ", type: "Offer", detail: "old", status: "Pending" },
      { id: 2, buyer: "alice", type: "Offer", detail: "new", status: "Countered" },
    ];
    expect(latestOffersByBuyer(offers)).toEqual([offers[1]]);
    expect(mergeListingOffers([offers[0]], [offers[1]])).toEqual([offers[0]]);
  });

  test("dealsDonutBackground handles empty and populated deal sets", () => {
    expect(dealsDonutBackground([{ label: "Sold", count: 0, tone: "sold" }])).toBe("#edf0f2");
    expect(dealsDonutBackground([
      { label: "Sold", count: 1, tone: "sold" },
      { label: "Given", count: 1, tone: "given" },
    ])).toContain("conic-gradient");
    expect(
      dealsDonutBackground([{ label: "Other", count: 2, tone: "unknown" as any }]),
    ).toContain("var(--navy)");
  });

  test("withListingChatPeople merges people without duplicate buyers", () => {
    expect(
      withListingChatPeople(
        [{ id: 1, buyer: "Alice", type: "Offer", detail: "Offer", status: "Pending" }],
        [
          { id: "p1", buyer: "alice", lastMessage: "Duplicate" },
          { id: "p2", buyer: "Bob", lastMessage: "" },
        ],
      ),
    ).toHaveLength(2);
    expect(
      withListingChatPeople([], [
        { id: "p1", buyer: "", lastMessage: "ignored" },
        { id: "p2", buyer: "Bob", lastMessage: "" },
      ]),
    ).toEqual([
      { id: "p2", buyer: "Bob", type: "Chat", detail: "Conversation started", status: "Chat" },
    ]);
  });

  test("chatOffersForListing handles empty buyers, sender filtering, and listing types", () => {
    const messages = [
      { id: 1, sender: "buyer" as const, body: "Borrow until Friday", time: "", kind: "offer" as const },
      { id: 2, sender: "seller" as const, body: "Offer: HK$80", time: "", kind: "offer" as const, offerId: 2 },
      { id: 3, sender: "buyer" as const, body: "Hello", time: "", kind: "message" as const },
    ];
    const sellListing = { type: "Sell" } as any;
    const giveaway = { type: "Give Away" } as any;
    expect(chatOffersForListing(sellListing, messages, "  ", "Seller")).toEqual([]);
    expect(chatOffersForListing(sellListing, messages, "bob", "Buyer")).toMatchObject([
      { id: "chat-1", buyer: "bob", type: "Borrow", status: "Pending" },
    ]);
    expect(chatOffersForListing(giveaway, messages, "bob", "Seller")).toMatchObject([
      { type: "Borrow" },
      { id: 2, type: "Claim" },
    ]);
  });

  test("avatarInitials handles names and empty values", () => {
    expect(avatarInitials("")).toBe("?");
    expect(avatarInitials("Alice")).toBe("AL");
    expect(avatarInitials("Alice Bob")).toBe("AB");
  });

  test("isUsableListingPhoto rejects empty and SVG data images", () => {
    expect(isUsableListingPhoto("https://example.com/photo.jpg")).toBe(true);
    expect(isUsableListingPhoto("")).toBe(false);
    expect(isUsableListingPhoto("data:image/svg+xml;base64,abc")).toBe(false);
  });
});
