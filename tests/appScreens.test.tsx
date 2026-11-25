import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import App from "../src/App";
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
  RatingDialog,
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
  SellerStats,
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
        listings: [
          mainListing,
          listing({ id: 2, type: "Lend", price: undefined, duration: 2, durationUnit: "Days" }),
          listing({
            id: 3,
            type: "Give Away",
            price: undefined,
            condition: "For Parts",
            image: "data:image/svg+xml;base64,abc",
            availability: "Rejected",
          }),
        ],
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
      { id: 4, sender: "seller", body: "Accepted offer", time: "10:03", kind: "offer", offerId: 10, offerStatus: "Accepted" },
      { id: 5, sender: "buyer", body: "Plain chat", time: "10:04", kind: "message" },
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
          deal({ id: 7, kind: "Claim", status: "Accepted" }),
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
      requests: [
        request,
        { ...request, id: 7, dealId: 7, type: "Borrow", listing: listing({ id: 7, type: "Lend" }) },
        { ...request, id: 8, dealId: 8, type: "Claim", listing: listing({ id: 8, type: "Give Away" }) },
        { ...request, id: 9, status: "Accepted" },
        { ...request, id: 10, listingStatus: "Sold" },
      ],
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
      records: [
        record,
        ...(["Pending", "Rejected", "Reserved", "Sold", "Lent", "Given"] as const).map(
          (status, index) => ({
            ...record,
            id: index + 2,
            status,
            activeOffers: index % 2,
            listing: listing({
              id: index + 2,
              title: `Listing ${status}`,
              image: index === 1 ? "data:image/svg+xml;base64,abc" : mainListing.image,
            }),
          }),
        ),
      ],
      onRecordsChange: noop,
      ...callbacks,
    };
    expect(renderScreen(SellerListingsPage, listingProps)).toContain("Desk lamp");
    expect(renderScreen(SellerListingsPage, { ...listingProps, records: [] })).toContain("No listings");
    expect(
      renderScreen(SellerReviewsPage, {
        reviews: [
          review,
          { ...review, id: 5, reply: "Thank you!", repliedAt: "Yesterday" },
          { ...review, id: 6, flagged: true, flagReason: "Spam" },
        ],
        onReviewsChange: noop,
        ...callbacks,
      }),
    ).toContain("Great transaction");
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
        records: [
          reviewRecord,
          { ...reviewRecord, id: 2, status: "Approved" },
          { ...reviewRecord, id: 3, status: "Rejected", rejectionReason: "Reason" },
          { ...reviewRecord, id: 4, status: "Removed" },
        ],
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
        users: [seller, buyer, { ...seller, id: "seller2", username: "carol", status: undefined, residence: undefined }],
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
        records: [
          systemListing,
          ...(["Pending Review", "Reserved", "Sold", "Lent", "Given", "Rejected", "Removed"] as const).map(
            (status, index) => ({
              ...systemListing,
              id: index + 2,
              status,
              listing: listing({ id: index + 2, title: `System listing ${status}` }),
            }),
          ),
        ],
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
      items: [
        notification,
        {
          ...notification,
          id: 2,
          category: "Deal",
          title: "Completed deal",
          dateGroup: "Earlier",
          action: undefined,
        },
      ],
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

  test("RatingDialog and the default App render their initial states", () => {
    expect(
      renderScreen(RatingDialog, {
        deal: deal(),
        onClose: noop,
        onSubmit: noop,
      }),
    ).toContain("Rate your experience");
    expect(renderScreen(App, {})).toContain("Loading your session");
  });

  test("SupportingPage routes dashboard pages and renders dashboard fallbacks", () => {
    const supportProps = {
      page: "",
      role: "Seller",
      onAction: noop,
      onRefresh: refresh,
      onOpenListing: noop,
      onChatListing: noop,
      onRecordFormalChat: noop,
      onNavigate: noop,
      buyerDealState: [deal()],
      onBuyerDealsChange: noop,
      sellerRequests: [request],
      onSellerRequestsChange: noop,
      notifications: [],
      notificationReads: [],
      onNotificationReadsChange: noop,
      reviewListings: [],
      listingReports: [],
      onReviewListingsChange: noop,
      users: [seller],
      onUsersChange: noop,
      sellerListingRecords: [],
      onSellerListingRecordsChange: noop,
      sellerReviews: [review, { ...review, id: 5, hidden: true, rating: 4 }],
      onSellerReviewsChange: noop,
      systemListings: [],
      onSystemListingsChange: noop,
      systemDeals: [],
      sellerRatings: [rating],
      historyDeals: [],
      sellerStats: {
        views: 10,
        offers: 2,
        completed: 1,
        averageRating: 4.5,
        viewsByListing: [{ title: "Desk lamp", views: 10 }],
        dealsByType: [{ label: "Sold", count: 1, tone: "sold" }],
      } satisfies SellerStats,
      liveListings: [mainListing],
      currentUsername: "alice",
      adminProfile,
      onAdminProfileChange: noop,
      ratedDealIds: [],
      onRatedDealIdsChange: noop,
      chatOnlyListingIds: new Set<number>(),
    };

    for (const page of [
      "My Deals",
      "Deal History",
      "Rate Sellers",
      "Offers / Requests",
      "Notifications",
      "Listing Review",
      "All Users",
      "My Listings",
      "Reviews",
      "All Listings",
      "All Deals",
      "Ratings Overview",
      "Create Listing",
      "Profile",
    ]) {
      expect(renderScreen(SupportingPage, { ...supportProps, page })).not.toBe("");
    }

    expect(renderScreen(SupportingPage, { ...supportProps, page: "Stats" })).toContain("Views by listing");
    expect(renderScreen(SupportingPage, { ...supportProps, page: "Unknown" })).toContain("Unknown");
  });
});
