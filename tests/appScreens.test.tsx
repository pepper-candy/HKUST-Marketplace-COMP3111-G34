import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import {
  AllDealsPage,
  AllListingsPage,
  AuthPortal,
  Browse,
  ChatScreen,
  CreateListingForm,
  DealHistoryPage,
  DetailModal,
  ListingReviewPage,
  ManageUsersPage,
  MyDealsPage,
  NotificationBoard,
  ProfilePage,
  RateSellersPage,
  RatingsOverviewPage,
  SellerListingsPage,
  SellerProfileModal,
  SellerRequestsPage,
  SellerReviewsPage,
  SupportingPage,
} from "../src/App";
import type {
  AdminProfile,
  BuyerDeal,
  ChatMessage,
  HistoryDeal,
  Listing,
  MarketplaceUser,
  NotificationItem,
  SellerRating,
  SellerRequest,
  SellerReview,
} from "../src/lib/api";

const noop = () => {};
const refresh = async () => {};
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
  image: "https://example.com/lamp.jpg",
  description: "A useful lamp",
  ...overrides,
});
const mainListing = listing();
const deal = (overrides: Partial<BuyerDeal> = {}): BuyerDeal => ({
  id: 2,
  listing: mainListing,
  kind: "Offer",
  status: "Pending",
  date: "Today",
  detail: "Offer: HK$200",
  ...overrides,
});
const seller: MarketplaceUser = {
  id: "seller-id",
  username: "alice",
  fullName: "Alice Chan",
  role: "Seller",
  status: "Active",
  residence: "Hall I",
  bio: "I sell useful items.",
  meetups: ["Library"],
};
const buyer: MarketplaceUser = {
  id: "buyer-id",
  username: "bob",
  fullName: "Bob Lee",
  role: "Buyer",
  status: "Deactivated",
};
const request: SellerRequest = {
  id: 3,
  dealId: 2,
  listing: mainListing,
  buyer: "bob",
  lastActionBy: "buyer",
  type: "Offer",
  submitted: "Today",
  detail: "Offer: HK$200",
  status: "Pending",
  listingStatus: "Available",
};
const review: SellerReview = {
  id: 4,
  rating: 5,
  text: "Great transaction",
  buyer: "bob",
  sellerUsername: "alice",
  date: "Today",
  dateKey: "2026-11-25",
  listing: mainListing,
};
const rating: SellerRating = {
  seller: "alice",
  name: "Alice Chan",
  average: 4.8,
  reviews: 3,
  fiveStar: 2,
  latest: "Today",
  latestAt: "2026-11-25T00:00:00Z",
  listings: 2,
};
const adminProfile: AdminProfile = {
  username: "admin@ust.hk",
  password: "unused",
  fullName: "Marketplace Admin",
};
const callbacks = {
  onAction: noop,
  onRefresh: refresh,
  onOpenListing: noop,
  onChatListing: noop,
  onRecordFormalChat: noop,
};
const renderScreen = (component: ComponentType<any>, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(component, props));

describe("App screen rendering", () => {
  test("Browse renders listings and the empty state", () => {
    expect(
      renderScreen(Browse, {
        listings: [mainListing, listing({ id: 2, type: "Lend", price: undefined })],
        onOpen: noop,
        onRefreshListings: refresh,
      }),
    ).toContain("Desk lamp");
    expect(
      renderScreen(Browse, { listings: [], onOpen: noop, onRefreshListings: refresh }),
    ).toContain("No listings found");
  });

  test("DetailModal renders role and listing-type variants", () => {
    const renderDetail = (item: Listing, role: "Buyer" | "Seller" | "Admin") =>
      renderScreen(DetailModal, {
        listing: item,
        role,
        currentUsername: role === "Seller" ? item.seller : "bob",
        listingOffers: [],
        onClose: noop,
        onAction: noop,
        onChat: noop,
        onViewSeller: noop,
      });
    expect(renderDetail(mainListing, "Buyer")).toContain("Loading listing details");
    expect(renderDetail(listing({ type: "Lend", price: undefined, duration: 2, durationUnit: "Days" }), "Seller")).toContain("Loading listing details");
    expect(renderDetail(listing({ type: "Give Away", price: undefined }), "Admin")).toContain("Loading listing details");
  });

  test("SellerProfileModal covers profiles with and without activity", () => {
    const common = {
      seller: "alice",
      fullName: "Alice Chan",
      onClose: noop,
      onOpenListing: noop,
    };
    expect(
      renderScreen(SellerProfileModal, {
        ...common,
        users: [],
        reviews: [],
        listings: [],
        sellerRatings: [],
      }),
    ).toContain("This seller has no active listings.");
    expect(
      renderScreen(SellerProfileModal, {
        ...common,
        users: [seller],
        reviews: [review],
        listings: [mainListing],
        sellerRatings: [rating],
      }),
    ).toContain("Great transaction");
  });

  test("ChatScreen renders buyer and seller conversations with offer states", () => {
    const messages: ChatMessage[] = [
      { id: 1, sender: "buyer", body: "Is this available?", time: "10:00", kind: "message" },
      { id: 2, sender: "seller", body: "Offer: HK$200", time: "10:01", kind: "offer", offerId: 8, offerStatus: "Countered" },
      { id: 3, sender: "buyer", body: "Older offer", time: "10:02", kind: "offer", offerId: 9, offerStatus: "Declined" },
    ];
    const renderChat = (role: "Buyer" | "Seller", type: Listing["type"]) =>
      renderScreen(ChatScreen, {
        listing: listing({ type }),
        role,
        threadId: 5,
        counterparty: "bob",
        activeOfferId: null,
        messages,
        onMessagesChange: noop,
        onBack: noop,
        onOpenListing: noop,
        onRefresh: refresh,
        onAction: noop,
        onFormalOfferSubmitted: noop,
      });
    expect(renderChat("Buyer", "Sell")).toContain("Is this available?");
    expect(renderChat("Seller", "Lend")).toContain("Older offer");
    expect(renderChat("Buyer", "Give Away")).toContain("Desk lamp");
  });

  test("buyer deal pages render empty, active, and completed records", () => {
    const myDealsProps = {
      ratedDealIds: [4],
      onRatedDealIdsChange: noop,
      chatOnlyListingIds: new Set<number>(),
      onDealsChange: noop,
      onOpenListing: noop,
      onChatListing: noop,
      onRecordFormalChat: noop,
      ...callbacks,
    };
    expect(renderScreen(MyDealsPage, { ...myDealsProps, deals: [] })).toContain("No active deals");
    expect(
      renderScreen(MyDealsPage, {
        ...myDealsProps,
        deals: [
          deal(),
          deal({ id: 3, kind: "Borrow", status: "Borrowed", dueDate: "Tomorrow" }),
          deal({ id: 4, completed: true, status: "Completed" }),
          deal({ id: 5, status: "Countered" }),
          deal({ id: 6, status: "Declined" }),
        ],
      }),
    ).toContain("Due Tomorrow");
    expect(
      renderScreen(RateSellersPage, {
        deals: [deal({ completed: true, status: "Completed" })],
        ratedDealIds: [],
        onRatedDealIdsChange: noop,
        onOpenListing: noop,
        ...callbacks,
      }),
    ).toContain("Rate seller");
    const history: HistoryDeal = {
      id: 8,
      listing: mainListing,
      date: "2026-11-20",
      type: "Bought",
      outcome: "Completed",
    };
    expect(renderScreen(DealHistoryPage, { deals: [history], onOpenListing: noop })).toContain("Desk lamp");
    expect(renderScreen(DealHistoryPage, { deals: [], onOpenListing: noop })).toContain("No matching deals");
  });

  test("seller pages render empty and populated request/listing/review states", () => {
    const requestProps = {
      requests: [request],
      onRequestsChange: noop,
      buyerDealState: [deal()],
      onBuyerDealsChange: noop,
      ...callbacks,
    };
    expect(renderScreen(SellerRequestsPage, requestProps)).toContain("bob");
    expect(renderScreen(SellerRequestsPage, { ...requestProps, requests: [] })).toContain("No pending requests");

    const record = {
      id: 1,
      listing: mainListing,
      status: "Live",
      activeOffers: 1,
      updated: "Today",
    };
    const listingProps = {
      records: [record],
      onRecordsChange: noop,
      ...callbacks,
    };
    expect(renderScreen(SellerListingsPage, listingProps)).toContain("Desk lamp");
    expect(renderScreen(SellerListingsPage, { ...listingProps, records: [] })).toContain("No listings");
    expect(renderScreen(SellerReviewsPage, { reviews: [review], onReviewsChange: noop, ...callbacks })).toContain("Great transaction");
    expect(renderScreen(SellerReviewsPage, { reviews: [], onReviewsChange: noop, ...callbacks })).toContain("No reviews yet");
  });

  test("admin pages render both populated and empty result states", () => {
    const reviewRecord = {
      id: 1,
      listing: mainListing,
      sellerFullName: "Alice Chan",
      submitted: "Today",
      status: "Pending Review",
    };
    expect(
      renderScreen(ListingReviewPage, {
        records: [reviewRecord],
        reports: [],
        onRecordsChange: noop,
        ...callbacks,
      }),
    ).toContain("Desk lamp");
    expect(
      renderScreen(ListingReviewPage, {
        records: [],
        reports: [],
        onRecordsChange: noop,
        ...callbacks,
      }),
    ).toContain("No pending review listings");

    expect(
      renderScreen(ManageUsersPage, {
        users: [seller, buyer],
        onUsersChange: noop,
        ...callbacks,
      }),
    ).toContain("Alice Chan");
    expect(
      renderScreen(ManageUsersPage, { users: [], onUsersChange: noop, ...callbacks }),
    ).toContain("No users found");

    const systemListing = {
      id: 1,
      listing: mainListing,
      sellerFullName: "Alice Chan",
      status: "Live",
      submitted: "Today",
    };
    expect(
      renderScreen(AllListingsPage, {
        records: [systemListing],
        onRecordsChange: noop,
        users: [seller],
        ...callbacks,
      }),
    ).toContain("Desk lamp");
    expect(
      renderScreen(AllListingsPage, {
        records: [],
        onRecordsChange: noop,
        users: [],
        ...callbacks,
      }),
    ).toContain("No listings found");
    const systemDeal = {
      id: 1,
      title: "Desk lamp",
      buyer: "bob",
      seller: "alice",
      type: "Sold",
      start: "Today",
      end: "Tomorrow",
      status: "Completed",
    };
    expect(renderScreen(AllDealsPage, { deals: [systemDeal] })).toContain("Desk lamp");
    expect(renderScreen(AllDealsPage, { deals: [] })).toContain("No deals found");
    expect(
      renderScreen(RatingsOverviewPage, { ratings: [rating], reviews: [review], onRefresh: refresh }),
    ).toContain("Alice Chan");
    expect(
      renderScreen(RatingsOverviewPage, { ratings: [], reviews: [], onRefresh: refresh }),
    ).toContain("No sellers found");
  });

  test("notification, profile, and listing forms render state variants", () => {
    const notification: NotificationItem = {
      id: 1,
      category: "Offer",
      title: "Offer for Desk lamp",
      message: "Alice sent an offer",
      timestamp: "Today",
      dateGroup: "Today",
      icon: "bag",
      tone: "gold",
      action: "View offer",
      listingId: mainListing.id,
    };
    const notificationProps = {
      role: "Seller",
      items: [notification],
      listings: [mainListing],
      sellerRequests: [request],
      buyerDeals: [deal()],
      readIds: [],
      onReadIdsChange: noop,
      onNavigate: noop,
      ...callbacks,
    };
    expect(renderScreen(NotificationBoard, notificationProps)).toContain("Offer for Desk lamp");
    expect(renderScreen(NotificationBoard, { ...notificationProps, items: [] })).toContain("No notifications here");

    const profileProps = {
      role: "Seller",
      currentUsername: "alice",
      users: [seller],
      onUsersChange: noop,
      adminProfile,
      onAdminProfileChange: noop,
      onRefresh: refresh,
    };
    expect(renderScreen(ProfilePage, profileProps)).toContain("Preferred meet-up locations");
    expect(renderScreen(ProfilePage, { ...profileProps, role: "Admin", users: [] })).toContain("Marketplace Admin");

    const formProps = { users: [seller], role: "Seller", ...callbacks };
    expect(renderScreen(CreateListingForm, formProps)).toContain("Start by choosing a listing type");
    expect(renderScreen(CreateListingForm, { ...formProps, role: "Admin" })).toContain("Start by choosing a listing type");
  });

  test("AuthPortal renders login and registration variants", () => {
    const authProps = {
      users: [seller],
      adminProfile,
      notice: "",
      onViewChange: noop,
      onRegister: noop,
      onLogin: noop,
    };
    expect(renderScreen(AuthPortal, { ...authProps, view: "login" })).toContain("Sign in to Marketplace");
    expect(renderScreen(AuthPortal, { ...authProps, view: "admin-login" })).toContain("Admin sign in");
    expect(renderScreen(AuthPortal, { ...authProps, view: "buyer-register" })).toContain("Create your buyer account");
    expect(renderScreen(AuthPortal, { ...authProps, view: "seller-register" })).toContain("Preferred meet-up locations");
  });
});
