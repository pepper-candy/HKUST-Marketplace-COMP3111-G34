import { describe, expect, test } from "vitest";
import {
  authEmailFromUsername,
  borrowPeriodError,
  chatMessageFromRow,
  chatOfferStatusUi,
  defaultBorrowPeriod,
  formatLendingDuration,
  hongKongDateTimeLocalValue,
  lendingDurationMs,
  listingMaxBorrowMs,
  mergeRealtimeChatMessage,
  notificationFromRow,
  offerDetailLabel,
  passwordRules,
} from "../src/lib/api";

describe("api utility functions", () => {
  test("authEmailFromUsername normalizes names and sanitizes addresses", () => {
    expect(authEmailFromUsername("  Alice  ")).toBe("g34mp+alice@gmail.com");
    expect(authEmailFromUsername("alice@example.com")).toBe("alice@example.com");
    expect(authEmailFromUsername("!!!")).toBe("g34mp+user@gmail.com");
    expect(authEmailFromUsername("  Alice@Example.COM  ")).toBe("alice@example.com");
    expect(authEmailFromUsername("中文")).toBe("g34mp+user@gmail.com");
  });

  test("passwordRules enforce all password requirements", () => {
    expect(passwordRules.map((rule) => rule.test("Abcdef12"))).toEqual([true, true, true, true]);
    expect(passwordRules.map((rule) => rule.test("abcdef"))).toEqual([false, false, true, false]);
  });

  test("lending duration helpers convert and format durations", () => {
    expect(lendingDurationMs(2, "Hours")).toBe(2 * 60 * 60 * 1000);
    expect(lendingDurationMs(3, "Days")).toBe(3 * 24 * 60 * 60 * 1000);
    expect(lendingDurationMs(2, "Weeks")).toBe(14 * 24 * 60 * 60 * 1000);
    expect(lendingDurationMs(0, "Days")).toBeNull();
    expect(lendingDurationMs(1, "Months")).toBeNull();
    expect(formatLendingDuration(1, "Days")).toBe("1 Day");
    expect(formatLendingDuration(2, "Weeks")).toBe("2 Weeks");
    expect(formatLendingDuration(null, "Hours")).toBe("");
    expect(listingMaxBorrowMs({ duration: 6, durationUnit: "Hours" })).toBe(6 * 60 * 60 * 1000);
  });

  test("defaultBorrowPeriod starts in one hour and ends within one day", () => {
    const period = defaultBorrowPeriod(new Date("2026-11-25T01:04:30Z"));
    expect(period.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:10:00$/);
    expect(period.end).toBeDefined();
    const shortPeriod = defaultBorrowPeriod(
      new Date("2026-11-25T01:04:30Z"),
      { duration: 1, durationUnit: "Hours" },
    );
    expect(Date.parse(`${shortPeriod.end}+08:00`)).toBeGreaterThan(
      Date.parse(`${shortPeriod.start}+08:00`),
    );
  });

  test("borrowPeriodError validates required, past, short, and excessive periods", () => {
    expect(borrowPeriodError("", "")).toBe("Choose both a start and end date.");
    expect(borrowPeriodError("invalid", "invalid")).toBe("Choose a valid start and end time.");
    expect(borrowPeriodError("2020-01-01T10:00", "2020-01-01T11:00")).toBe("Start time cannot be in the past.");
    expect(borrowPeriodError("2099-01-01T10:00", "2099-01-01T10:00:01")).toBe("End time must be at least 5 seconds after the start time.");
    expect(borrowPeriodError("2099-01-01T10:00", "2099-01-01T11:00")).toBeNull();
    expect(
      borrowPeriodError(
        "2099-01-01T10:00",
        "2099-01-01T12:00",
        { duration: 1, durationUnit: "Hours" },
      ),
    ).toBe("Borrow period cannot exceed 1 Hour.");
  });

  test("Hong Kong date formatting uses the supplied instant", () => {
    expect(hongKongDateTimeLocalValue(new Date("2026-01-01T00:00:00Z"))).toBe(
      "2026-01-01T08:00:00",
    );
  });

  test("offerDetailLabel covers sell, lend, and giveaway listings", () => {
    expect(offerDetailLabel({ type: "Sell", price: 1234.5 })).toBe("Offer: HK$1,234.5");
    expect(offerDetailLabel({ type: "Give Away" })).toBe("Claim: free");
    expect(offerDetailLabel({ type: "Lend", start: "2026-11-25T10:00:00+08:00", end: "2026-11-25T11:00:00+08:00" })).toContain("Borrow request:");
  });

  test("chatOfferStatusUi maps known statuses and rejects unknown values", () => {
    expect(chatOfferStatusUi("pending")).toBe("Pending");
    expect(chatOfferStatusUi("countered")).toBe("Countered");
    expect(chatOfferStatusUi("cancelled")).toBe("Declined");
    expect(chatOfferStatusUi("accepted_by_seller")).toBe("Accepted");
    expect(chatOfferStatusUi("mystery")).toBeUndefined();
  });

  test("chatMessageFromRow assigns sender, offer, and kind fields", () => {
    expect(
      chatMessageFromRow(
        { id: 7, sender_id: "me", body: "hello", kind: "offer", offer_id: 12, created_at: "2026-11-25T01:00:00Z" },
        "Seller",
        "me",
        "Pending",
      ),
    ).toMatchObject({ id: 7, sender: "seller", body: "hello", kind: "offer", offerId: 12, offerStatus: "Pending" });
    expect(
      chatMessageFromRow(
        { id: 8, sender_id: "other", body: "plain", kind: "text", offer_id: "", created_at: "2026-11-25T01:00:00Z" },
        "Buyer",
        "me",
      ),
    ).toMatchObject({ sender: "seller", kind: "message", offerId: undefined, offerStatus: undefined });
    expect(
      chatMessageFromRow(
        { id: 9, sender_id: "me", body: "offer", kind: "offer", offer_id: "not-an-id", created_at: "2026-11-25T01:00:00Z" },
        "Buyer",
        "me",
      ),
    ).toMatchObject({ sender: "buyer", offerId: undefined });
  });

  test("mergeRealtimeChatMessage deduplicates ids and replaces optimistic copies", () => {
    const incoming = { id: 8, sender: "buyer" as const, body: "hello", time: "now", kind: "message" as const };
    expect(mergeRealtimeChatMessage([], incoming)).toEqual([incoming]);
    expect(mergeRealtimeChatMessage([incoming], incoming)).toEqual([incoming]);
    const optimistic = {
      ...incoming,
      id: 1_000_000_000_001,
      time: "earlier",
    };
    expect(mergeRealtimeChatMessage([optimistic], incoming)).toEqual([incoming]);
    expect(
      mergeRealtimeChatMessage(
        [{ ...optimistic, body: "different" }],
        incoming,
      ),
    ).toEqual([{ ...optimistic, body: "different" }, incoming]);
    expect(
      mergeRealtimeChatMessage(
        [{ ...optimistic, sender: "seller" }],
        incoming,
      ),
    ).toHaveLength(2);
  });

  test("notificationFromRow normalizes optional fields", () => {
    expect(
      notificationFromRow({
        id: 3,
        category: "Offer",
        title: "New offer",
        message: "Offer received",
        created_at: "2020-01-01T00:00:00Z",
      }),
    ).toMatchObject({ id: 3, category: "Offer", title: "New offer", icon: "bell", tone: "navy" });
    expect(
      notificationFromRow({
        id: 4,
        category: "Deal",
        title: "Updated",
        message: "Done",
        icon: "",
        tone: "green",
        action: "View deal",
        listing_id: 15,
        thread_id: 23,
        created_at: new Date().toISOString(),
      }),
    ).toMatchObject({
      icon: "bell",
      tone: "green",
      action: "View deal",
      listingId: 15,
      threadId: 23,
      dateGroup: "Today",
    });
  });
});
