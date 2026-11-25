// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BuyerDeal, ChatMessage, Listing, MarketplaceUser } from "../src/lib/api";

const mockedApi = vi.hoisted(() => ({
  incrementViews: vi.fn(),
  submitListingAction: vi.fn(),
  postOfferChatIfBuyerThread: vi.fn(),
  moderateListing: vi.fn(),
  reportListing: vi.fn(),
  sendChatMessage: vi.fn(),
  respondToOffer: vi.fn(),
  buyerCounterOffer: vi.fn(),
  buyerDeclineOffer: vi.fn(),
  declineCounterOffer: vi.fn(),
  acceptCounterOffer: vi.fn(),
  acceptListingPrice: vi.fn(),
  sellerMakeOffer: vi.fn(),
  listMyChatThreads: vi.fn(),
  deleteChatThread: vi.fn(),
  returnBorrow: vi.fn(),
  completeDeal: vi.fn(),
  uploadListingPhotos: vi.fn(),
  createListing: vi.fn(),
  updateOwnProfile: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
  markNotificationsRead: vi.fn(),
  openChatThread: vi.fn(),
  findChatWithUsername: vi.fn(),
  resolveListingReport: vi.fn(),
  adminUpdateUser: vi.fn(),
  adminSetUserStatus: vi.fn(),
  adminDeleteUser: vi.fn(),
  sellerRemoveListing: vi.fn(),
  updateListingDetails: vi.fn(),
  replyToReview: vi.fn(),
  flagReview: vi.fn(),
  hideRating: vi.fn(),
  loadSnapshot: vi.fn(),
  restoreSession: vi.fn(),
  logoutAccount: vi.fn(),
  subscribeMyNotifications: vi.fn(),
  subscribeChatThread: vi.fn(),
  listListingChatPeople: vi.fn(),
  openChat: vi.fn(),
  loadChatMessages: vi.fn(),
  profileIdByUsername: vi.fn(),
}));

vi.mock("../src/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/lib/api")>(),
  ...mockedApi,
}));

import {
  AuthPortal,
  AllDealsPage,
  AllListingsPage,
  Browse,
  ChatScreen,
  CreateListingForm,
  DetailModal,
  ListingReviewPage,
  ManageUsersPage,
  MyDealsPage,
  NotificationBoard,
  ProfilePage,
  RatingsOverviewPage,
  SellerRequestsPage,
  SellerListingsPage,
  SellerReviewsPage,
} from "../src/App";
import App from "../src/App";

const listing = (overrides: Partial<Listing> = {}): Listing => ({
  id: 1,
  title: "Desk lamp",
  seller: "alice",
  category: "Furniture & Home",
  type: "Sell",
  price: 250,
  condition: "Good",
  location: "Library",
  posted: "Today",
  image: "https://example.invalid/lamp.jpg",
  description: "A useful lamp",
  ...overrides,
});

const deal = (overrides: Partial<BuyerDeal> = {}): BuyerDeal => ({
  id: 21,
  listing: listing(),
  kind: "Offer",
  status: "Countered",
  date: "Today",
  detail: "Offer: HK$200",
  ...overrides,
});

const user: MarketplaceUser = {
  id: "seller-id",
  username: "alice",
  fullName: "Alice Chan",
  role: "Seller",
  status: "Active",
  bio: "Useful things",
  meetups: ["Library Entrance"],
};

const noOp = () => {};
const refresh = vi.fn(async () => undefined);
const emptyChatChange = vi.fn();

function modalProps(item = listing(), role: "Buyer" | "Seller" | "Admin" = "Buyer") {
  return {
    listing: item,
    role,
    currentUsername: role === "Seller" ? item.seller : "bob",
    listingOffers: [],
    onClose: vi.fn(),
    onAction: vi.fn(),
    onChat: vi.fn(),
    onViewSeller: vi.fn(),
  };
}

function chatProps(
  messages: ChatMessage[] = [],
  overrides: Partial<Parameters<typeof ChatScreen>[0]> = {},
) {
  return {
    listing: listing(),
    role: "Buyer" as const,
    threadId: 7,
    counterparty: "alice",
    activeOfferId: null,
    messages,
    onMessagesChange: emptyChatChange,
    onBack: noOp,
    onOpenListing: noOp,
    onRefresh: refresh,
    onAction: vi.fn(),
    onFormalOfferSubmitted: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  refresh.mockResolvedValue(undefined);
  mockedApi.incrementViews.mockResolvedValue(null);
  mockedApi.submitListingAction.mockResolvedValue(41);
  mockedApi.postOfferChatIfBuyerThread.mockResolvedValue(undefined);
  mockedApi.moderateListing.mockResolvedValue(undefined);
  mockedApi.reportListing.mockResolvedValue(undefined);
  mockedApi.sendChatMessage.mockImplementation(async (_threadId, body, kind, role, offerId) => ({
    id: 500,
    body,
    kind,
    sender: role === "Seller" ? "seller" : "buyer",
    offerId,
    time: "10:00",
  }));
  mockedApi.respondToOffer.mockResolvedValue(undefined);
  mockedApi.buyerCounterOffer.mockResolvedValue(undefined);
  mockedApi.buyerDeclineOffer.mockResolvedValue(undefined);
  mockedApi.declineCounterOffer.mockResolvedValue(undefined);
  mockedApi.acceptCounterOffer.mockResolvedValue(undefined);
  mockedApi.acceptListingPrice.mockResolvedValue(41);
  mockedApi.sellerMakeOffer.mockResolvedValue(undefined);
  mockedApi.listMyChatThreads.mockResolvedValue([]);
  mockedApi.deleteChatThread.mockResolvedValue(undefined);
  mockedApi.returnBorrow.mockResolvedValue(undefined);
  mockedApi.completeDeal.mockResolvedValue(undefined);
  mockedApi.uploadListingPhotos.mockResolvedValue([]);
  mockedApi.createListing.mockResolvedValue(undefined);
  mockedApi.updateOwnProfile.mockResolvedValue(undefined);
  mockedApi.loginAccount.mockResolvedValue({ role: "Buyer", username: "bob" });
  mockedApi.registerAccount.mockResolvedValue(undefined);
  mockedApi.markNotificationsRead.mockResolvedValue(undefined);
  mockedApi.openChatThread.mockResolvedValue(null);
  mockedApi.findChatWithUsername.mockResolvedValue(null);
  mockedApi.resolveListingReport.mockResolvedValue(undefined);
  mockedApi.adminUpdateUser.mockResolvedValue(undefined);
  mockedApi.adminSetUserStatus.mockResolvedValue(undefined);
  mockedApi.adminDeleteUser.mockResolvedValue(undefined);
  mockedApi.sellerRemoveListing.mockResolvedValue(undefined);
  mockedApi.updateListingDetails.mockResolvedValue(0);
  mockedApi.replyToReview.mockResolvedValue(undefined);
  mockedApi.flagReview.mockResolvedValue(undefined);
  mockedApi.hideRating.mockResolvedValue(undefined);
  mockedApi.loadSnapshot.mockResolvedValue({});
  mockedApi.restoreSession.mockResolvedValue(null);
  mockedApi.logoutAccount.mockResolvedValue(undefined);
  mockedApi.subscribeMyNotifications.mockReturnValue(() => {});
  mockedApi.subscribeChatThread.mockReturnValue(() => {});
  mockedApi.listListingChatPeople.mockResolvedValue([]);
  mockedApi.openChat.mockResolvedValue(71);
  mockedApi.openChatThread.mockResolvedValue({ participant: "alice" });
  mockedApi.loadChatMessages.mockResolvedValue([]);
  mockedApi.profileIdByUsername.mockResolvedValue("seller-id");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App interactive branches", () => {
  test("Browse filters by query, category, type, price, condition, and sort", async () => {
    const items = [
      listing({ id: 1, title: "Physics book", category: "Books & Course Materials", type: "Sell", price: 350, condition: "New" }),
      listing({ id: 2, title: "History book", category: "Books & Course Materials", type: "Lend", price: 900, condition: "Used" }),
      listing({ id: 3, title: "Camera", category: "Other", type: "Sell", price: 2500, condition: "Like New" }),
    ];
    const onOpen = vi.fn();
    let finishRefresh = () => {};
    const onRefreshListings = vi.fn(
      () => new Promise<void>((resolve) => {
        finishRefresh = resolve;
      }),
    );
    const { container } = render(
      <Browse listings={items} onOpen={onOpen} onRefreshListings={onRefreshListings} />,
    );
    const filters = screen.getAllByRole("combobox");
    const search = screen.getByPlaceholderText("Search listings, categories, or sellers...");

    fireEvent.change(search, { target: { value: "physics" } });
    expect(screen.getByText("Physics book")).toBeTruthy();
    expect(screen.queryByText("History book")).toBeNull();
    fireEvent.change(search, { target: { value: "" } });
    fireEvent.change(filters[1], { target: { value: "Books & Course Materials" } });
    expect(screen.getByText("2 active listings from the HKUST community")).toBeTruthy();
    fireEvent.change(filters[2], { target: { value: "Sell" } });
    fireEvent.change(filters[3], { target: { value: "Under HK$500" } });
    fireEvent.change(filters[4], { target: { value: "New" } });
    expect(screen.getByText("1 active listings from the HKUST community")).toBeTruthy();
    fireEvent.change(filters[0], { target: { value: "Price: high to low" } });
    fireEvent.click(screen.getByText("Physics book"));
    expect(onOpen).toHaveBeenCalledWith(items[0]);

    fireEvent.change(search, { target: { value: "no match" } });
    expect(screen.getByText("No listings found")).toBeTruthy();
    fireEvent.change(search, { target: { value: "" } });
    const refreshButton = screen.getByRole("button", { name: "Refresh listings" });
    fireEvent.click(refreshButton);
    expect(screen.getByRole("button", { name: "Refreshing…" })).toHaveProperty("disabled", true);
    await act(async () => finishRefresh());
    await waitFor(() => expect(screen.getByRole("button", { name: "Refresh listings" })).toHaveProperty("disabled", false));
    expect(container.querySelector(".listing-grid")).toBeTruthy();
  });

  test("DetailModal validates and submits buyer offers without using a real API", async () => {
    vi.useFakeTimers();
    mockedApi.incrementViews.mockResolvedValue(12);
    const props = modalProps(listing({ images: ["first.jpg", "second.jpg"] }));
    render(<DetailModal {...props} />);
    expect(screen.getByRole("dialog", { name: "Loading listing details" })).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(260);
      await Promise.resolve();
    });
    expect(screen.getByText("Viewed 12 times")).toBeTruthy();
    expect(mockedApi.incrementViews).toHaveBeenCalledWith(1);
    vi.useRealTimers();

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByText("2 / 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View full photo" }));
    expect(screen.getByRole("dialog", { name: "Full listing photo" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close photo" }));

    fireEvent.click(screen.getAllByRole("button", { name: /Send Offer \/ Bid/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Send Offer \/ Bid/ })[0]);
    expect(screen.getByText("Enter a valid offer amount.")).toBeTruthy();
    fireEvent.change(document.querySelector('.request-form input[type="number"]')!, {
      target: { value: "90" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Send Offer \/ Bid/ })[0]);
    await waitFor(() => expect(props.onAction).toHaveBeenCalledWith("Offer: HK$90 sent to @alice"));
    expect(mockedApi.submitListingAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ price: 90 }),
    );
    expect(mockedApi.postOfferChatIfBuyerThread).toHaveBeenCalledOnce();

    vi.spyOn(window, "prompt").mockReturnValue(null);
    fireEvent.click(screen.getByRole("button", { name: "Report Listing" }));
    expect(mockedApi.reportListing).not.toHaveBeenCalled();
    vi.spyOn(window, "prompt").mockReturnValue("Unsafe");
    fireEvent.click(screen.getByRole("button", { name: "Report Listing" }));
    await waitFor(() =>
      expect(props.onAction).toHaveBeenCalledWith("Listing reported to administrators"),
    );
  });

  test("DetailModal enforces admin moderation reasons and handles failures", async () => {
    const props = modalProps(listing({ availability: "Pending review" }), "Admin");
    mockedApi.moderateListing.mockRejectedValueOnce(new Error("moderation failed"));
    render(<DetailModal {...props} />);
    await act(async () => new Promise((resolve) => setTimeout(resolve, 270)));

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject and notify" }));
    expect(screen.getByText("Provide a written reason.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Be specific and actionable..."), {
      target: { value: "Duplicate listing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject and notify" }));
    await waitFor(() => expect(screen.getByText("moderation failed")).toBeTruthy());
    expect(mockedApi.moderateListing).toHaveBeenCalledWith(1, "reject", "Duplicate listing");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve listing" }));
    await waitFor(() =>
      expect(props.onAction).toHaveBeenCalledWith("Listing approved. @alice was notified."),
    );
  });

  test("DetailModal validates borrow periods and submits borrow and giveaway actions", async () => {
    const borrowProps = modalProps(
      listing({ type: "Lend", price: undefined, duration: 2, durationUnit: "Days" }),
    );
    render(<DetailModal {...borrowProps} />);
    await screen.findByText("Viewed 0 times");
    fireEvent.click(screen.getByRole("button", { name: "Request to Borrow" }));
    const dates = document.querySelectorAll<HTMLInputElement>(
      ".request-form input[type='datetime-local']",
    );
    fireEvent.change(dates[0], { target: { value: "" } });
    fireEvent.change(dates[1], { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Borrow Request" }));
    expect(screen.getByText("Choose both a start and end date.")).toBeTruthy();
    fireEvent.change(dates[0], { target: { value: "2099-01-01T10:00" } });
    fireEvent.change(dates[1], { target: { value: "2099-01-01T11:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Borrow Request" }));
    await waitFor(() => expect(borrowProps.onAction).toHaveBeenCalledWith("Borrow request sent to @alice"));
    expect(mockedApi.submitListingAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "Lend" }),
      expect.objectContaining({ start: "2099-01-01T10:00", end: "2099-01-01T11:00" }),
    );
    cleanup();

    const giveawayProps = modalProps(
      listing({ type: "Give Away", price: undefined, availability: "Available" }),
    );
    mockedApi.submitListingAction.mockRejectedValueOnce(new Error("already claimed"));
    render(<DetailModal {...giveawayProps} />);
    await screen.findByText("Viewed 0 times");
    fireEvent.click(screen.getByRole("button", { name: "Claim Item" }));
    await waitFor(() => expect(screen.getByText("already claimed")).toBeTruthy());
    expect(mockedApi.submitListingAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "Give Away" }),
      {},
    );
  });

  test("ChatScreen filters messages, sends text and validates formal offers", async () => {
    const messages: ChatMessage[] = [
      { id: 1, sender: "seller", body: "Offer: HK$100", time: "10:00", kind: "offer", offerId: 31, offerStatus: "Countered" },
      { id: 2, sender: "buyer", body: "Hello there", time: "10:01", kind: "message" },
      { id: 3, sender: "seller", body: "__HKUST_OFFER_DECLINED__:Old offer", time: "10:02", kind: "message" },
    ];
    const props = chatProps(messages);
    render(<ChatScreen {...props} />);
    expect(screen.queryByText("__HKUST_OFFER_DECLINED__:Old offer")).toBeNull();

    fireEvent.change(screen.getByRole("textbox", { name: "Search chat history" }), {
      target: { value: "missing" },
    });
    expect(screen.getByText("No messages found")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByText("Hello there")).toBeTruthy();

    fireEvent.change(screen.getByRole("textbox", { name: "Message alice" }), {
      target: { value: "  Is this available?  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(mockedApi.sendChatMessage).toHaveBeenCalledWith(7, "Is this available?", "message", "Buyer", undefined);

    fireEvent.click(screen.getByRole("button", { name: "Counter" }));
    fireEvent.click(screen.getByRole("button", { name: "Send offer" }));
    expect(screen.getByText("Enter a valid offer amount.")).toBeTruthy();
    fireEvent.change(document.querySelector('.chat-offer-panel input[type="number"]')!, {
      target: { value: "125" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send offer" }));
    await waitFor(() => expect(mockedApi.buyerCounterOffer).toHaveBeenCalledWith(31, expect.objectContaining({ price: 125 })));
    expect(props.onFormalOfferSubmitted).toHaveBeenCalledWith(1);
    expect(props.onAction).toHaveBeenCalledWith("Counter sent");
  });

  test("ChatScreen confirms buyer acceptance and routes seller responses to mocked APIs", async () => {
    const buyerMessage: ChatMessage = {
      id: 9,
      sender: "seller",
      body: "Offer: HK$250",
      time: "10:00",
      kind: "offer",
      offerId: 44,
      offerStatus: "Pending",
    };
    const buyerProps = chatProps([buyerMessage]);
    const { unmount } = render(<ChatScreen {...buyerProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Accept offer" })[0]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Accept offer" }).at(-1)!);
    await waitFor(() => expect(mockedApi.acceptCounterOffer).toHaveBeenCalledWith(44));
    unmount();

    const sellerProps = chatProps(
      [{ ...buyerMessage, id: 10, sender: "buyer", offerStatus: "Countered" }],
      { role: "Seller", activeOfferId: 44 },
    );
    render(<ChatScreen {...sellerProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.click(screen.getByRole("button", { name: "Decline offer" }));
    await waitFor(() => expect(mockedApi.respondToOffer).toHaveBeenCalledWith(44, "decline"));
    expect(sellerProps.onAction).toHaveBeenCalledWith("Offer declined. @alice was notified.");
  });

  test("MyDealsPage handles counters, return/completion, chat deletion, and refresh failures", async () => {
    const borrowed = deal({ id: 22, kind: "Borrow", status: "Borrowed" });
    const pendingCounter = deal({ id: 23, kind: "Offer", status: "Countered" });
    const accepted = deal({ id: 24, kind: "Claim", status: "Accepted" });
    mockedApi.listMyChatThreads.mockResolvedValue([
      { id: 8, listing: listing(), counterparty: "alice", lastMessage: "hello" },
    ]);
    const props = {
      deals: [borrowed, pendingCounter, accepted],
      ratedDealIds: [],
      onRatedDealIdsChange: vi.fn(),
      chatOnlyListingIds: new Set<number>(),
      onDealsChange: vi.fn(),
      onOpenListing: vi.fn(),
      onChatListing: vi.fn(),
      onRecordFormalChat: vi.fn(),
      onAction: vi.fn(),
      onRefresh: refresh,
    };
    render(<MyDealsPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Return early" }));
    await waitFor(() => expect(mockedApi.returnBorrow).toHaveBeenCalledWith(22));
    expect(props.onAction).toHaveBeenCalledWith("Desk lamp marked as returned");

    fireEvent.click(screen.getByRole("button", { name: "Counter" }));
    fireEvent.click(screen.getByRole("button", { name: "Send counter" }));
    expect(screen.getByText("Enter a valid counter price.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Enter amount"), { target: { value: "180" } });
    refresh.mockRejectedValueOnce(new Error("refresh failed"));
    fireEvent.click(screen.getByRole("button", { name: "Send counter" }));
    await waitFor(() => expect(mockedApi.buyerCounterOffer).toHaveBeenCalledWith(23, expect.objectContaining({ price: 180 })));
    expect(props.onRecordFormalChat).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Accept offer" }));
    await waitFor(() => expect(mockedApi.acceptCounterOffer).toHaveBeenCalledWith(23));
    expect(props.onAction).toHaveBeenCalledWith("Desk lamp counter offer accepted");

    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    await waitFor(() => expect(mockedApi.completeDeal).toHaveBeenCalledWith(24));
    expect(screen.getByText("Rate your experience")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "5 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
    await waitFor(() => expect(props.onRatedDealIdsChange).toHaveBeenCalledWith([24]));

    fireEvent.click(screen.getByRole("button", { name: /^Chats/ }));
    await waitFor(() => expect(screen.getByText("Chat · @alice")).toBeTruthy());
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Hide chat/ }));
    await waitFor(() => expect(mockedApi.deleteChatThread).toHaveBeenCalledWith(8));
  });

  test("SellerRequestsPage filters, counters, accepts, and declines with mocked operations", async () => {
    const borrowListing = listing({ id: 2, type: "Lend", price: undefined, duration: 2, durationUnit: "Days" });
    const requests = [
      {
        id: 31,
        dealId: 31,
        listing: listing(),
        buyer: "bob",
        lastActionBy: "buyer",
        type: "Offer",
        submitted: "Today",
        detail: "Offer: HK$100",
        status: "Pending",
        listingStatus: "Available",
      },
      {
        id: 32,
        dealId: 32,
        listing: borrowListing,
        buyer: "carol",
        lastActionBy: "buyer",
        type: "Borrow",
        submitted: "Today",
        detail: "Borrow request",
        status: "Pending",
        listingStatus: "Reserved",
      },
      {
        id: 33,
        dealId: 33,
        listing: listing({ id: 3, type: "Give Away", price: undefined }),
        buyer: "dave",
        lastActionBy: "buyer",
        type: "Claim",
        submitted: "Today",
        detail: "Claim",
        status: "Accepted",
        listingStatus: "Available",
      },
      {
        id: 34,
        dealId: 34,
        listing: listing({ id: 4 }),
        buyer: "erin",
        lastActionBy: "seller",
        type: "Offer",
        submitted: "Today",
        detail: "Offer: HK$75",
        status: "Pending",
        listingStatus: "Sold",
      },
    ] as const;
    const props = {
      requests: [...requests],
      onRequestsChange: vi.fn(),
      buyerDealState: [],
      onBuyerDealsChange: vi.fn(),
      onChatListing: vi.fn(),
      onRecordFormalChat: vi.fn(),
      onAction: vi.fn(),
      onRefresh: refresh,
    };
    const { unmount } = render(<SellerRequestsPage {...props} />);
    expect(document.querySelector(".request-summary strong")?.textContent).toBe("2");
    expect(screen.getAllByText("Desk lamp")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /^All/ }));
    expect(screen.getByText("3 requests")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Counter" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Send counter" }));
    expect(screen.getByText("Enter a valid counter price.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Enter amount"), { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "Send counter" }));
    await waitFor(() => expect(mockedApi.respondToOffer).toHaveBeenCalledWith(
      31,
      "counter",
      expect.objectContaining({ price: 120 }),
    ));
    expect(props.onRecordFormalChat).toHaveBeenCalledWith(
      requests[0].listing,
      "bob",
      "Offer: HK$120",
      31,
    );
    unmount();

    const acceptProps = { ...props, requests: [requests[0]] };
    const acceptedPage = render(<SellerRequestsPage {...acceptProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Accept request" }));
    await waitFor(() => expect(acceptProps.onRequestsChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 31, status: "Accepted", listingStatus: "Reserved" }),
    ]));
    acceptedPage.unmount();

    const declineProps = { ...props, requests: [requests[0]] };
    render(<SellerRequestsPage {...declineProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.click(screen.getByRole("button", { name: "Decline request" }));
    await waitFor(() => expect(mockedApi.respondToOffer).toHaveBeenCalledWith(31, "decline"));
    expect(declineProps.onAction).toHaveBeenCalledWith("Buyer @bob notified");
  });

  test("SellerRequestsPage validates lending dates before sending a borrow counter", async () => {
    const borrowListing = listing({
      id: 45,
      type: "Lend",
      price: undefined,
      duration: 2,
      durationUnit: "Days",
    });
    const request = {
      id: 45,
      dealId: 45,
      listing: borrowListing,
      buyer: "bob",
      lastActionBy: "buyer",
      type: "Borrow",
      submitted: "Today",
      detail: "Borrow request",
      status: "Pending",
      listingStatus: "Available",
    };
    render(
      <SellerRequestsPage
        requests={[request]}
        onRequestsChange={vi.fn()}
        buyerDealState={[]}
        onBuyerDealsChange={vi.fn()}
        onChatListing={vi.fn()}
        onRecordFormalChat={vi.fn()}
        onAction={vi.fn()}
        onRefresh={refresh}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Counter" }));
    const dates = document.querySelectorAll<HTMLInputElement>(
      ".counter-form input[type='datetime-local']",
    );
    fireEvent.change(dates[0], { target: { value: "" } });
    fireEvent.change(dates[1], { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Send counter" }));
    expect(screen.getByText("Choose both a start and end date.")).toBeTruthy();
    fireEvent.change(dates[0], { target: { value: "2099-01-01T10:00" } });
    fireEvent.change(dates[1], { target: { value: "2099-01-01T11:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Send counter" }));
    await waitFor(() => expect(mockedApi.respondToOffer).toHaveBeenCalledWith(
      45,
      "counter",
      expect.objectContaining({ start: "2099-01-01T10:00", end: "2099-01-01T11:00" }),
    ));
  });

  test("SellerListingsPage handles offer warnings, photo validation, edits, and deletion", async () => {
    const records = [
      {
        id: 1,
        listing: listing({ id: 1, title: "Active offer item", images: ["one.jpg", "two.jpg"] }),
        status: "Live",
        activeOffers: 1,
        updated: "Today",
      },
      {
        id: 2,
        listing: listing({
          id: 2,
          title: "Rejected item",
          images: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"],
        }),
        status: "Rejected",
        activeOffers: 0,
        updated: "Yesterday",
        rejectionReason: "Add more detail",
      },
      {
        id: 3,
        listing: listing({ id: 3, title: "Sold item" }),
        status: "Sold",
        activeOffers: 0,
        updated: "Last week",
      },
      {
        id: 4,
        listing: listing({ id: 4, title: "Pending item" }),
        status: "Pending",
        activeOffers: 0,
        updated: "Today",
      },
    ];
    const props = {
      records,
      onRecordsChange: vi.fn(),
      onOpenListing: vi.fn(),
      onAction: vi.fn(),
      onRefresh: refresh,
    };
    render(<SellerListingsPage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Open Sold item" }));
    expect(props.onOpenListing).toHaveBeenCalledWith(records[2].listing);
    fireEvent.click(screen.getByRole("button", { name: /^Sold/ }));
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Lent/ }));
    expect(screen.getByText("No lent listings")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View all listings" }));

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    expect(screen.getByText("Edit a listing with active offers?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue to edit" }));
    expect(screen.getByText(/Buyers with active offers will be notified/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: "Edit & resubmit" }));
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(["x"], "extra-one.png", { type: "image/png" }),
          new File(["x"], "extra-two.png", { type: "image/png" }),
        ],
      },
    });
    expect(screen.getByText("You can upload up to 6 photos. 1 slots remain.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove Photo 1" }));
    fireEvent.change(fileInput, {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] },
    });
    expect(screen.getByText("Only image files can be uploaded.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Improved item" } });
    fireEvent.click(screen.getByRole("button", { name: "Save & resubmit" }));
    await waitFor(() => expect(mockedApi.updateListingDetails).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ title: "Improved item", resubmit: true }),
    ));
    expect(props.onAction).toHaveBeenCalledWith("Improved item resubmitted with status Pending");

    fireEvent.click(screen.getAllByRole("button", { name: "Delete", exact: true })[0]);
    expect(screen.getByText("This listing has buyer or deal activity.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Delete", exact: true })[2]);
    expect(screen.getByText("This action cannot be undone. The listing will be removed from My Listings.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete listing" }));
    await waitFor(() => expect(mockedApi.sellerRemoveListing).toHaveBeenCalledWith(4));
  });

  test("SellerReviewsPage filters, replies, and flags review fixtures", async () => {
    const reviews = [
      {
        id: 10,
        rating: 5,
        text: "Smooth transaction",
        buyer: "bob",
        sellerUsername: "alice",
        date: "Today",
        dateKey: "2025-01-01",
        listing: listing(),
      },
      {
        id: 11,
        rating: 2,
        text: "Late meetup",
        buyer: "carol",
        sellerUsername: "alice",
        date: "Yesterday",
        dateKey: "2024-12-31",
        listing: listing({ id: 2, title: "Textbook" }),
        reply: "Thanks for your feedback",
        repliedAt: "Yesterday",
        flagged: true,
        flagReason: "Spam",
      },
    ];
    const props = {
      reviews,
      onReviewsChange: vi.fn(),
      onOpenListing: vi.fn(),
      onAction: vi.fn(),
      onRefresh: refresh,
    };
    render(<SellerReviewsPage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /^Needs reply/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    fireEvent.click(screen.getByRole("button", { name: "Send reply & notify buyer" }));
    expect(screen.getByText("Write a reply before sending.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Write a helpful, professional response..."), {
      target: { value: "Thank you!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reply & notify buyer" }));
    await waitFor(() => expect(mockedApi.replyToReview).toHaveBeenCalledWith(10, "Thank you!"));
    expect(props.onReviewsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 10, reply: "Thank you!" })]),
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Reply sent. @bob received a notification.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Flag review" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit flag" }));
    expect(screen.getByText("Choose a reason for flagging this review.")).toBeTruthy();
    const selectors = screen.getAllByRole("combobox");
    fireEvent.change(selectors[1], { target: { value: "Spam or unrelated content" } });
    fireEvent.change(screen.getByPlaceholderText("Give the moderator helpful context..."), {
      target: { value: "Unrelated links" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit flag" }));
    await waitFor(() => expect(mockedApi.flagReview).toHaveBeenCalledWith(
      10,
      "Spam or unrelated content: Unrelated links",
    ));

    fireEvent.click(screen.getByRole("button", { name: /^Flagged/ }));
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "1 star" } });
    expect(screen.getByText("No matching reviews")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear review filters" }));
    expect(screen.getByText("Late meetup", { exact: false })).toBeTruthy();
  });

  test("AllListingsPage searches, filters, and moderates only mocked listings", async () => {
    const records = [
      {
        id: 31,
        listing: listing({ id: 31, title: "Pending camera" }),
        sellerFullName: "Alice Chan",
        status: "Pending Review",
        submitted: "Today",
      },
      {
        id: 32,
        listing: listing({ id: 32, title: "Live notebook" }),
        sellerFullName: "Bob Lee",
        status: "Live",
        submitted: "Yesterday",
      },
    ];
    const props = {
      records,
      onRecordsChange: vi.fn(),
      onOpenListing: vi.fn(),
      onAction: vi.fn(),
      onRefresh: refresh,
      users: [user],
    };
    render(<AllListingsPage {...props} />);
    fireEvent.change(screen.getByPlaceholderText("Search title or seller..."), {
      target: { value: "camera" },
    });
    expect(screen.getByText("Pending camera")).toBeTruthy();
    expect(screen.queryByText("Live notebook")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(props.onOpenListing).toHaveBeenCalledWith(records[0].listing);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve listing" }));
    await waitFor(() => expect(mockedApi.moderateListing).toHaveBeenCalledWith(31, "approve", undefined));

    fireEvent.change(screen.getByPlaceholderText("Search title or seller..."), {
      target: { value: "" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Reject & notify" }));
    expect(screen.getByText("Provide a written reason.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Provide a clear moderation reason..."), {
      target: { value: "Missing details" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject & notify" }));
    await waitFor(() => expect(mockedApi.moderateListing).toHaveBeenCalledWith(
      31,
      "reject",
      "Missing details",
    ));

    fireEvent.click(screen.getByRole("button", { name: "Take down" }));
    fireEvent.change(screen.getByPlaceholderText("Provide a clear moderation reason..."), {
      target: { value: "Policy violation" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Take down & notify" }));
    await waitFor(() => expect(mockedApi.moderateListing).toHaveBeenCalledWith(
      32,
      "remove",
      "Policy violation",
    ));

    fireEvent.change(screen.getByPlaceholderText("Search title or seller..."), {
      target: { value: "not present" },
    });
    expect(screen.getByText("No listings found")).toBeTruthy();
  });

  test("AllDealsPage filters fixture deals and clears an empty result", () => {
    const deals = [
      {
        id: 1,
        title: "Desk lamp",
        buyer: "bob",
        seller: "alice",
        type: "Sold" as const,
        start: "Today",
        end: "Tomorrow",
        status: "Completed",
      },
      {
        id: 2,
        title: "Course book",
        buyer: "carol",
        seller: "alice",
        type: "Lent" as const,
        start: "Yesterday",
        end: "Next week",
        status: "In progress",
      },
    ];
    render(<AllDealsPage deals={deals} />);
    fireEvent.change(screen.getByPlaceholderText("Search item, buyer, or seller..."), {
      target: { value: "bob" },
    });
    expect(screen.getByText("Desk lamp")).toBeTruthy();
    expect(screen.queryByText("Course book")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Search item, buyer, or seller..."), {
      target: { value: "unmatched" },
    });
    expect(screen.getByText("No deals found")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(screen.getByText("Course book")).toBeTruthy();
    const filters = screen.getAllByRole("combobox");
    fireEvent.change(filters[0], { target: { value: "Lent" } });
    fireEvent.change(filters[1], { target: { value: "In progress" } });
    expect(screen.getByText("Course book")).toBeTruthy();
  });

  test("RatingsOverviewPage filters date/rating and toggles hidden review fixtures", async () => {
    const ratings = [
      {
        seller: "alice",
        name: "Alice Chan",
        average: 4.5,
        reviews: 2,
        fiveStar: 1,
        latest: "Today",
        latestAt: "2025-01-02T00:00:00Z",
        listings: 3,
      },
      {
        seller: "bob",
        name: "Bob Lee",
        average: 3,
        reviews: 1,
        fiveStar: 0,
        latest: "Yesterday",
        latestAt: "",
        listings: 1,
      },
    ];
    const reviews = [
      {
        id: 91,
        rating: 5,
        text: "Great seller",
        buyer: "carol",
        sellerUsername: "alice",
        date: "Today",
        dateKey: "2025-01-02",
        listing: listing({ id: 91, seller: "alice" }),
      },
      {
        id: 92,
        rating: 4,
        text: "Hidden note",
        buyer: "dave",
        sellerUsername: "alice",
        date: "Yesterday",
        dateKey: "2025-01-01",
        listing: listing({ id: 92, seller: "alice" }),
        hidden: true,
      },
    ];
    render(<RatingsOverviewPage ratings={ratings} reviews={reviews} onRefresh={refresh} />);
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "4.5" } });
    expect(screen.getByText("Alice Chan")).toBeTruthy();
    expect(screen.queryByText("Bob Lee")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /View seller ratings/ }));
    expect(screen.getByText("@alice · 1 public · 1 hidden")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hide review" }));
    await waitFor(() => expect(mockedApi.hideRating).toHaveBeenCalledWith(91, true));
    fireEvent.click(screen.getByRole("button", { name: "Show review" }));
    await waitFor(() => expect(mockedApi.hideRating).toHaveBeenCalledWith(92, false));
    fireEvent.click(document.querySelector(".seller-ratings-dialog .modal-close")!);

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2025-02-01" } });
    expect(screen.getByText("No sellers found")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear rating filters" }));
    expect(screen.getByText("Alice Chan")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Search seller..."), {
      target: { value: "unknown" },
    });
    expect(screen.getByText("No sellers found")).toBeTruthy();
  });

  test("NotificationBoard filters, marks reads, navigates, and opens mocked chats", async () => {
    const item = (overrides = {}) => ({
      id: 1,
      category: "Offer",
      title: 'Offer for "Desk lamp"',
      message: "Alice sent an offer",
      timestamp: "Today",
      dateGroup: "Today" as const,
      icon: "bag",
      tone: "gold" as const,
      action: "View listing",
      listingId: 1,
      ...overrides,
    });
    const props = {
      role: "Buyer" as const,
      items: [
        item(),
        item({ id: 2, category: "Deal", title: "Chat with Alice", action: "Open chat", threadId: 77 }),
        item({ id: 3, category: "Review", title: "Old update", dateGroup: "Earlier", action: undefined }),
      ],
      listings: [listing()],
      sellerRequests: [],
      buyerDeals: [],
      readIds: [3],
      onReadIdsChange: vi.fn(),
      onOpenListing: vi.fn(),
      onChatListing: vi.fn(),
      onNavigate: vi.fn(),
    };
    const { rerender } = render(<NotificationBoard {...props} />);
    expect(document.querySelector(".notification-summary strong")?.textContent).toBe("2");
    fireEvent.click(screen.getByRole("button", { name: "View listing" }));
    expect(props.onReadIdsChange).toHaveBeenCalledWith([3, 1]);
    expect(mockedApi.markNotificationsRead).toHaveBeenCalledWith([1]);
    expect(props.onNavigate).toHaveBeenCalledWith("Browse");
    expect(props.onOpenListing).toHaveBeenCalledWith(props.listings[0]);

    mockedApi.openChatThread.mockResolvedValueOnce({
      listing: props.listings[0],
      participant: "alice",
    });
    fireEvent.click(screen.getByRole("button", { name: "Open chat" }));
    await waitFor(() => expect(mockedApi.openChatThread).toHaveBeenCalledWith(77));
    expect(props.onChatListing).toHaveBeenCalledWith(props.listings[0], "alice");
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(props.onReadIdsChange).toHaveBeenCalledWith([1, 2, 3]);
    expect(mockedApi.markNotificationsRead).toHaveBeenCalledWith([1, 2, 3]);

    rerender(<NotificationBoard {...props} readIds={[1, 2, 3]} />);
    fireEvent.click(screen.getByRole("button", { name: /^Unread/ }));
    expect(screen.getByText("No notifications here")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View all notifications" }));
    expect(screen.getByText("Old update")).toBeTruthy();
  });

  test("ListingReviewPage approves, rejects, and resolves report fixtures", async () => {
    const pending = {
      id: 61,
      listing: listing({ id: 61, title: "Pending item" }),
      sellerFullName: "Alice Chan",
      submitted: "Today",
      status: "Pending Review" as const,
    };
    const report = {
      id: 71,
      listing: listing({ id: 71, title: "Reported item", images: ["a.jpg", "b.jpg"] }),
      reporter: "bob",
      reason: "Unsafe description",
      status: "Pending",
      submitted: "Today",
    };
    const props = {
      records: [pending, { ...pending, id: 62, status: "Rejected" as const, rejectionReason: "Needs details" }],
      reports: [report],
      onRecordsChange: vi.fn(),
      onAction: vi.fn(),
      onRefresh: refresh,
      onOpenListing: vi.fn(),
    };
    const { unmount } = render(<ListingReviewPage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Approve", exact: false }));
    fireEvent.click(screen.getByRole("button", { name: "Approve listing" }));
    await waitFor(() => expect(mockedApi.moderateListing).toHaveBeenCalledWith(61, "approve"));
    expect(props.onAction).toHaveBeenCalledWith("Listing approved. @alice was notified.");
    unmount();

    const rejecting = render(<ListingReviewPage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Reject", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Reject and notify seller" }));
    expect(screen.getByText("Provide a written reason.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Be specific and actionable..."), {
      target: { value: "Duplicate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject and notify seller" }));
    await waitFor(() => expect(mockedApi.moderateListing).toHaveBeenCalledWith(61, "reject", "Duplicate"));
    rejecting.unmount();

    render(<ListingReviewPage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /^Reports/ }));
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    await waitFor(() => expect(mockedApi.resolveListingReport).toHaveBeenCalledWith(71, "reviewed"));
    expect(props.onOpenListing).toHaveBeenCalledWith(report.listing);
  });

  test("ManageUsersPage filters, edits, deactivates, and deletes dummy users", async () => {
    const inactiveBuyer: MarketplaceUser = {
      id: "buyer-id",
      username: "bob",
      fullName: "Bob Lee",
      role: "Buyer",
      status: "Deactivated",
    };
    const props = {
      users: [user, inactiveBuyer],
      onUsersChange: vi.fn(),
      onAction: vi.fn(),
      onRefresh: refresh,
    };
    render(<ManageUsersPage {...props} />);
    fireEvent.change(screen.getByPlaceholderText("Search username or full name..."), {
      target: { value: "alice" },
    });
    expect(screen.getByText("Alice Chan")).toBeTruthy();
    expect(screen.queryByText("Bob Lee")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Search username or full name..."), {
      target: { value: "" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "View / Edit" })[0]);
    fireEvent.change(screen.getByDisplayValue("Alice Chan"), { target: { value: "Alice Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(mockedApi.adminUpdateUser).toHaveBeenCalledWith(
      "seller-id",
      expect.objectContaining({ fullName: "Alice Updated" }),
    ));
    expect(props.onAction).toHaveBeenCalledWith("@alice updated");

    fireEvent.click(screen.getAllByRole("button", { name: "Deactivate" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Deactivate account" }));
    await waitFor(() => expect(mockedApi.adminSetUserStatus).toHaveBeenCalledWith("seller-id", "deactivated"));
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    await waitFor(() => expect(mockedApi.adminDeleteUser).toHaveBeenCalledWith("seller-id"));
    expect(props.onAction).toHaveBeenCalledWith("@alice permanently deleted");
  });

  test("CreateListingForm validates photos and submits using mocked storage/API calls", async () => {
    const onAction = vi.fn();
    const onRefresh = vi.fn(async () => undefined);
    const createObjectURL = vi.fn(() => "blob:unit-test");
    const revokeObjectURL = vi.fn();
    class TestURL extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    }
    vi.stubGlobal("URL", TestURL);
    render(<CreateListingForm onAction={onAction} onRefresh={onRefresh} users={[user]} role="Seller" />);
    expect(screen.getByText("Start by choosing a listing type")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Sell/));
    const form = screen.getByRole("button", { name: "Submit for review" }).closest("form");
    expect(form).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Listing title"), { target: { value: "Calculator" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Books & Course Materials" } });
    fireEvent.change(screen.getByLabelText("Condition"), { target: { value: "Used" } });
    fireEvent.change(screen.getByLabelText("Meet-up location"), { target: { value: "North Gate" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Scientific calculator" } });
    fireEvent.change(document.querySelector('input[name="price"]')!, { target: { value: "100" } });

    const fileInput = containerFileInput();
    const textFile = new File(["not an image"], "notes.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [textFile] } });
    expect(screen.getByText("Only image files can be uploaded.")).toBeTruthy();

    const excessPhotos = Array.from({ length: 7 }, (_, index) =>
      new File([`image-${index}`], `photo-${index}.png`, { type: "image/png" }),
    );
    fireEvent.change(fileInput, { target: { files: excessPhotos } });
    expect(screen.getByText(/You can upload up to 6 photos/)).toBeTruthy();

    const photo = new File(["image"], "photo.png", { type: "image/png", lastModified: 1 });
    fireEvent.change(fileInput, { target: { files: [photo] } });
    expect(createObjectURL).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Remove photo.png" }));
    expect(revokeObjectURL).toHaveBeenCalledOnce();

    fireEvent.submit(form!);
    await waitFor(() => expect(mockedApi.createListing).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Calculator", type: "Sell", price: 100, sellerId: undefined }),
    ));
    expect(mockedApi.uploadListingPhotos).toHaveBeenCalledOnce();
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("Listing submitted with status Pending Review");
    fireEvent.click(screen.getByRole("button", { name: "Create another listing" }));
    expect(screen.getByText("Start by choosing a listing type")).toBeTruthy();
  });

  test("CreateListingForm covers lending and admin submission branches", async () => {
    const activeSeller = user;
    const inactiveSeller = { ...user, id: "inactive", username: "inactive", status: "Deactivated" as const };
    const onAction = vi.fn();
    const onRefresh = vi.fn(async () => undefined);
    const { unmount } = render(
      <CreateListingForm
        onAction={onAction}
        onRefresh={onRefresh}
        users={[activeSeller, inactiveSeller]}
        role="Admin"
      />,
    );
    fireEvent.click(screen.getByLabelText(/Give Away/));
    expect(screen.queryByLabelText(/Lending duration/)).toBeNull();
    expect(screen.queryByRole("option", { name: /@inactive/ })).toBeNull();
    fireEvent.change(screen.getByLabelText("Seller account"), { target: { value: "seller-id" } });
    fireEvent.change(screen.getByLabelText("Listing title"), { target: { value: "Free book" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Books & Course Materials" } });
    fireEvent.change(screen.getByLabelText("Condition"), { target: { value: "Used" } });
    fireEvent.change(screen.getByLabelText("Meet-up location"), { target: { value: "North Gate" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Take it for free" } });

    mockedApi.uploadListingPhotos.mockRejectedValueOnce(new Error("photo upload failed"));
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(await screen.findByText("photo upload failed")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() => expect(mockedApi.createListing).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "Give Away",
        title: "Free book",
        sellerId: "seller-id",
        goLive: true,
      }),
    ));
    expect(onAction).toHaveBeenCalledWith("Listing added to the marketplace");
    unmount();

    const sellerProps = {
      onAction: vi.fn(),
      onRefresh: vi.fn(async () => undefined),
      users: [activeSeller],
      role: "Seller" as const,
    };
    mockedApi.createListing.mockClear();
    render(<CreateListingForm {...sellerProps} />);
    fireEvent.click(screen.getByLabelText(/Lend/));
    expect(screen.getByLabelText("Lending duration unit")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Listing title"), { target: { value: "Loaner book" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Books & Course Materials" } });
    fireEvent.change(screen.getByLabelText("Condition"), { target: { value: "Used" } });
    fireEvent.change(screen.getByLabelText("Meet-up location"), { target: { value: "North Gate" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Borrow for study" } });
    fireEvent.change(document.querySelector('input[name="duration"]')!, {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Lending duration unit"), {
      target: { value: "Weeks" },
    });
    const form = document.querySelector<HTMLFormElement>(".create-listing-card")!;
    const invalidFields = Array.from(form.elements)
      .filter((element) => "checkValidity" in element && !element.checkValidity())
      .map((element) => [element.name, element.value]);
    expect(invalidFields).toEqual([]);
    fireEvent.submit(form);
    await waitFor(() => expect(mockedApi.createListing).toHaveBeenCalledWith(
      expect.objectContaining({ type: "Lend", duration: 2, durationUnit: "Weeks" }),
    ));
  });

  test("ProfilePage and AuthPortal show validation errors and submit through mocked APIs", async () => {
    const profileProps = {
      role: "Seller" as const,
      currentUsername: "alice",
      users: [user],
      onUsersChange: vi.fn(),
      adminProfile: { username: "admin@ust.hk", password: "", fullName: "Admin" },
      onAdminProfileChange: vi.fn(),
      onRefresh: refresh,
    };
    const { unmount } = render(<ProfilePage {...profileProps} />);
    const fullName = document.querySelector(".profile-card label input")!;
    fireEvent.change(fullName, { target: { value: " " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Full name is required.")).toBeTruthy();
    fireEvent.change(fullName, { target: { value: "Alice Chan" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Your new password does not meet all strength requirements.")).toBeTruthy();
    expect(screen.getByText("Passwords do not match.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Enter a new password"), { target: { value: "" } });
    fireEvent.change(screen.getByPlaceholderText("Re-enter new password"), { target: { value: "orphan" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Enter a new password first.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Re-enter new password"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.getByText("Profile changes saved successfully.")).toBeTruthy());
    expect(mockedApi.updateOwnProfile).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Alice Chan", bio: "Useful things" }),
    );
    unmount();

    const loginProps = {
      view: "login" as const,
      users: [user],
      adminProfile: { username: "admin@ust.hk", password: "", fullName: "Admin" },
      notice: "",
      onViewChange: vi.fn(),
      onRegister: vi.fn(),
      onLogin: vi.fn(),
    };
    render(<AuthPortal {...loginProps} />);
    fireEvent.change(screen.getByPlaceholderText("Enter your username"), { target: { value: "bob" } });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "Abcd1234" } });
    mockedApi.loginAccount.mockRejectedValueOnce(new Error("Invalid credentials"));
    fireEvent.click(screen.getByRole("button", { name: /Sign in as Buyer/ }));
    expect(await screen.findByText("Invalid credentials")).toBeTruthy();
  });

  test("AuthPortal validates registration and submits a seller with selected meetups", async () => {
    const onRegister = vi.fn();
    const props = {
      view: "seller-register" as const,
      users: [],
      adminProfile: { username: "admin@ust.hk", password: "", fullName: "Admin" },
      notice: "",
      onViewChange: vi.fn(),
      onRegister,
      onLogin: vi.fn(),
    };
    render(<AuthPortal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Create Seller account" }));
    expect(screen.getByText("Choose a username.")).toBeTruthy();
    expect(screen.getByText("Enter your full name.")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("e.g. alex.chan"), {
      target: { value: "  Alice  " },
    });
    fireEvent.change(screen.getByPlaceholderText("Your full name"), {
      target: { value: " Alice Chan " },
    });
    fireEvent.change(screen.getByPlaceholderText("Create a strong password"), {
      target: { value: "Abcd1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter your password"), {
      target: { value: "Abcd1234" },
    });
    fireEvent.click(screen.getByLabelText("Library Entrance"));
    fireEvent.click(screen.getByRole("button", { name: "Create Seller account" }));
    await waitFor(() => expect(mockedApi.registerAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "alice",
        fullName: "Alice Chan",
        role: "Seller",
        meetups: ["Library Entrance"],
      }),
    ));
    expect(onRegister).toHaveBeenCalledWith(
      expect.objectContaining({ username: "alice", role: "Seller" }),
    );
  });

  test("App restores, authenticates, navigates, and logs out using snapshot fixtures", async () => {
    const snapshot = {
      users: [user, { id: "buyer-id", username: "bob", fullName: "Bob Lee", role: "Buyer", status: "Active" }],
      adminProfile: { username: "admin@ust.hk", password: "", fullName: "Marketplace Admin" },
      currentUsername: "bob",
      currentUserId: "buyer-id",
      role: "Buyer",
      liveListings: [listing()],
      buyerDeals: [],
      ratedDealIds: [],
      sellerRequests: [],
      notifications: [],
      readNotificationIds: [],
      reviewListings: [],
      listingReports: [],
      sellerListingRecords: [],
      sellerReviews: [],
      systemListings: [],
      systemDeals: [],
      sellerRatings: [],
      historyDeals: [],
      sellerStats: {
        views: 0,
        offers: 0,
        completed: 0,
        averageRating: 0,
        viewsByListing: [],
        dealsByType: [],
      },
    };
    mockedApi.loadSnapshot.mockResolvedValue(snapshot);
    render(<App />);
    expect(await screen.findByText("Sign in to Marketplace")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Enter your username"), {
      target: { value: "bob" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "Abcd1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign in as Buyer/ }));

    expect(await screen.findByText("Find what you need, right on campus.")).toBeTruthy();
    expect(mockedApi.loadSnapshot).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(mockedApi.subscribeMyNotifications).toHaveBeenCalledWith(
        "buyer-id",
        expect.objectContaining({ onInsert: expect.any(Function), onUpdate: expect.any(Function) }),
      ),
    );

    fireEvent.click(screen.getByText("Desk lamp"));
    await screen.findByText("Viewed 0 times");
    fireEvent.click(screen.getByRole("button", { name: "Chat" }));
    expect(await screen.findByText("PRIVATE THREAD")).toBeTruthy();
    expect(mockedApi.openChat).toHaveBeenCalledWith(1, "buyer-id");
    expect(mockedApi.openChatThread).toHaveBeenCalledWith(71);
    fireEvent.click(screen.getByRole("button", { name: /Back to marketplace/ }));
    expect(await screen.findByText("Find what you need, right on campus.")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /My Deals/ })[0]);
    expect(await screen.findByText("No active deals")).toBeTruthy();
    expect(mockedApi.loadSnapshot).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByText("Sign in to Marketplace")).toBeTruthy();
    expect(mockedApi.logoutAccount).toHaveBeenCalledOnce();
  });

  test("App clears a failed restored session without entering the marketplace", async () => {
    mockedApi.restoreSession.mockRejectedValue(new Error("session unavailable"));
    render(<App />);
    expect(await screen.findByText("Sign in to Marketplace")).toBeTruthy();
    expect(mockedApi.logoutAccount).toHaveBeenCalledOnce();
    expect(mockedApi.loadSnapshot).not.toHaveBeenCalled();
  });
});

function containerFileInput() {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}
