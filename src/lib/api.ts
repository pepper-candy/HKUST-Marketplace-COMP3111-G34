import { supabase } from "./supabase";

/** Marketplace role that controls available pages and actions. */
export type Role = "Buyer" | "Seller" | "Admin";

/** Public profile fields shared by buyer and seller accounts. */
export type MarketplaceUser = {
  /** Unique profile identifier. */
  id?: string;
  /** Account username. */
  username: string;
  /** User's display name. */
  fullName: string;
  /** Marketplace role for this account. */
  role: "Buyer" | "Seller";
  /** Residence or hall information. */
  residence?: string;
  /** Public profile biography. */
  bio?: string;
  /** Preferred meetup locations. */
  meetups?: string[];
  /** Whether the account is active or deactivated. */
  status?: "Active" | "Deactivated";
};

/** Local administrator identity and display information. */
export type AdminProfile = {
  /** Administrator sign-in username. */
  username: string;
  /** Administrator password for the local sign-in flow. */
  password: string;
  /** Administrator's display name. */
  fullName: string;
};

/** Marketplace listing data used throughout the application. */
export type Listing = {
  /** Unique listing identifier. */
  id: number;
  /** Listing title. */
  title: string;
  /** Seller's username. */
  seller: string;
  /** Listing category. */
  category: string;
  /** Whether the item is sold, lent, or given away. */
  type: "Sell" | "Lend" | "Give Away";
  /** Asking price for a sale listing. */
  price?: number;
  /** Maximum lending duration amount. */
  duration?: number;
  /** Unit for the maximum lending duration. */
  durationUnit?: "Hours" | "Days" | "Weeks";
  /** Item condition. */
  condition: string;
  /** Preferred meetup location. */
  location: string;
  /** Human-readable posting date. */
  posted: string;
  /** Primary listing photo URL. */
  image: string;
  /** Additional listing photo URLs. */
  images?: string[];
  /** Seller-provided item description. */
  description: string;
  /** Number of listing views. */
  views?: number;
  /** Current availability or moderation status. */
  availability?: string;
  /** Seller's full display name, when available. */
  sellerFullName?: string;
  /** Seller's average rating, when available. */
  sellerRating?: number;
  /** Number of seller reviews, when available. */
  sellerReviewCount?: number;
};

/** Normalized status of an offer displayed in a chat thread. */
export type ChatOfferStatus = "Pending" | "Accepted" | "Declined" | "Countered";

/** Chat message or formal offer after mapping from the database. */
export type ChatMessage = {
  /** Unique message identifier. */
  id: number;
  /** Whether the message was sent by the buyer or seller. */
  sender: "buyer" | "seller";
  /** Message text or offer details. */
  body: string;
  /** Human-readable message time. */
  time: string;
  /** Distinguishes regular messages from formal offers. */
  kind?: "message" | "offer";
  /** Associated formal offer identifier. */
  offerId?: number;
  /** Current status of the associated offer. */
  offerStatus?: ChatOfferStatus;
};

/** Chat thread summary for the current user's inbox. */
export type MyChatThread = {
  /** Unique chat thread identifier. */
  id: number;
  /** Listing discussed in the thread. */
  listing: Listing;
  /** Other participant's username. */
  counterparty: string;
  /** Most recent message text. */
  lastMessage: string;
  /** Human-readable time of the latest activity. */
  updated: string;
};

/** Buyer-facing summary of a listing offer, borrow, or claim. */
export type BuyerDeal = {
  /** Unique offer or deal identifier. */
  id: number;
  /** Listing associated with the transaction. */
  listing: Listing;
  /** Transaction type requested by the buyer. */
  kind: "Offer" | "Borrow" | "Claim";
  /** Current offer or deal status. */
  status: string;
  /** Human-readable activity date. */
  date: string;
  /** Original timestamp used for sorting, when available. */
  rawDate?: string;
  /** Offer amount, requested period, or other transaction details. */
  detail: string;
  /** Borrow return date, when applicable. */
  dueDate?: string;
  /** Whether the deal has been marked complete. */
  completed?: boolean;
  /** Participant who most recently changed the open offer. */
  lastActionBy?: "buyer" | "seller" | null;
};

/** Seller-facing view of a buyer request and its current listing state. */
export type SellerRequest = {
  /** Unique request identifier. */
  id: number;
  /** Associated deal identifier. */
  dealId: number;
  /** Listing receiving the request. */
  listing: Listing;
  /** Requesting buyer's username. */
  buyer: string;
  /** Participant who most recently changed the request. */
  lastActionBy: "buyer" | "seller" | null;
  /** Requested sale, borrowing, or giveaway action. */
  type: "Offer" | "Borrow" | "Claim";
  /** Human-readable request submission time. */
  submitted: string;
  /** Offer amount, requested period, or other request details. */
  detail: string;
  /** Current request status. */
  status: "Pending" | "Accepted" | "Declined" | "Countered";
  /** Listing availability when the request was mapped. */
  listingStatus: "Available" | "Reserved" | "Sold" | "Lent" | "Given";
};

/** Application-ready notification content and its optional action targets. */
export type NotificationItem = {
  /** Unique notification identifier. */
  id: number;
  /** Notification category used for filtering. */
  category: string;
  /** Short notification heading. */
  title: string;
  /** Detailed notification text. */
  message: string;
  /** Human-readable notification time. */
  timestamp: string;
  /** Relative date group used to organize notifications. */
  dateGroup: "Today" | "Earlier";
  /** Icon name representing the notification. */
  icon: string;
  /** Visual color tone for the notification. */
  tone: "navy" | "gold" | "green" | "red";
  /** Optional action label shown with the notification. */
  action?: string;
  /** Listing targeted by the notification action. */
  listingId?: number;
  /** Chat thread targeted by the notification action. */
  threadId?: number;
};

/** Listing review record shown in the administrator queue. */
export type ReviewListing = {
  /** Unique listing identifier. */
  id: number;
  /** Listing awaiting or having completed moderation. */
  listing: Listing;
  /** Seller's full display name. */
  sellerFullName: string;
  /** Human-readable submission time. */
  submitted: string;
  /** Current moderation status. */
  status: "Pending Review" | "Approved" | "Rejected" | "Removed";
  /** Administrator's explanation when the listing is rejected. */
  rejectionReason?: string;
};

/** User-submitted report and its moderation resolution, if closed. */
export type ListingReport = {
  /** Unique report identifier. */
  id: number;
  /** Listing referenced by the report. */
  listing: Listing;
  /** Username of the reporting user. */
  reporter: string;
  /** User-provided reason for the report. */
  reason: string;
  /** Human-readable report submission time. */
  submitted: string;
  /** Whether the report still requires moderation. */
  status: "Pending" | "Closed";
  /** Resolution recorded when the report was closed. */
  closedAs?: "reviewed" | "dismissed";
};

/** Lifecycle states shown in the seller's listing manager. */
export type SellerListingStatus =
  | "Pending"
  | "Live"
  | "Rejected"
  | "Reserved"
  | "Sold"
  | "Lent"
  | "Given";

/** Seller listing with its activity count and moderation metadata. */
export type SellerListingRecord = {
  /** Unique listing identifier. */
  id: number;
  /** Seller's listing data. */
  listing: Listing;
  /** Current seller-facing listing lifecycle state. */
  status: SellerListingStatus;
  /** Number of active offers or requests. */
  activeOffers: number;
  /** Human-readable time of the latest listing update. */
  updated: string;
  /** Administrator's explanation when the listing was rejected. */
  rejectionReason?: string;
};

/** Buyer review with seller response and moderation fields. */
export type SellerReview = {
  /** Unique review identifier. */
  id: number;
  /** Buyer-submitted star rating. */
  rating: number;
  /** Buyer's written review. */
  text: string;
  /** Buyer's username. */
  buyer: string;
  /** Reviewed seller's username. */
  sellerUsername: string;
  /** Human-readable review date. */
  date: string;
  /** ISO-like date key used for sorting and filtering. */
  dateKey: string;
  /** Listing associated with the completed deal. */
  listing: Listing;
  /** Seller's reply to the review. */
  reply?: string;
  /** Human-readable reply time. */
  repliedAt?: string;
  /** Whether the review was flagged for moderation. */
  flagged?: boolean;
  /** Reason provided when the review was flagged. */
  flagReason?: string;
  /** Whether administrators have hidden the review. */
  hidden?: boolean;
};

/** Administrator-wide listing record with moderation status. */
export type SystemListing = {
  /** Unique listing identifier. */
  id: number;
  /** Listing data visible to administrators. */
  listing: Listing;
  /** Seller's full display name. */
  sellerFullName: string;
  /** Current system-wide listing status. */
  /** Current system-wide listing status. */
  status:
    | "Pending Review"
    | "Live"
    | "Reserved"
    | "Sold"
    | "Lent"
    | "Given"
    | "Rejected"
    | "Removed";
  /** Human-readable listing submission time. */
  submitted: string;
};

/** Administrator-wide summary of a marketplace deal. */
export type SystemDeal = {
  /** Unique deal identifier. */
  id: number;
  /** Listing title associated with the deal. */
  title: string;
  /** Buyer's username. */
  buyer: string;
  /** Seller's username. */
  seller: string;
  /** Completed transaction type. */
  type: "Sold" | "Lent" | "Given";
  /** Deal start date. */
  start: string;
  /** Deal end or return date. */
  end: string;
  /** Current deal status. */
  status: string;
};

/** Aggregate public rating statistics for one seller. */
export type SellerRating = {
  /** Seller's username. */
  seller: string;
  /** Seller's full display name. */
  name: string;
  /** Average star rating. */
  average: number;
  /** Total number of reviews. */
  reviews: number;
  /** Number of five-star reviews. */
  fiveStar: number;
  /** Human-readable date of the latest review. */
  latest: string;
  /** Timestamp of the latest review. */
  latestAt: string;
  /** Number of listings associated with the seller. */
  listings: number;
};

/** Completed transaction shown in a user's history. */
export type HistoryDeal = {
  /** Unique deal identifier. */
  id: number;
  /** Listing associated with the completed transaction. */
  listing: Listing;
  /** Deal date. */
  date: string;
  /** Buyer's transaction outcome. */
  type: "Bought" | "Borrowed" | "Received";
  /** Human-readable final deal status. */
  outcome: string;
};

/** Aggregated seller activity and chart data for the dashboard. */
export type SellerStats = {
  /** Total listing views for the seller. */
  views: number;
  /** Total offers received. */
  offers: number;
  /** Number of completed deals. */
  completed: number;
  /** Seller's average star rating. */
  averageRating: number;
  /** Per-listing view counts used by the dashboard chart. */
  viewsByListing: {
    /** Listing title. */
    title: string;
    /** Number of views for the listing. */
    views: number;
  }[];
  /** Deal counts grouped by transaction type for the dashboard chart. */
  dealsByType: {
    /** Transaction type displayed in the chart legend. */
    label: string;
    /** Number of deals in this transaction type. */
    count: number;
    /** CSS color identifier for the chart segment. */
    tone: string;
  }[];
};

/** Complete marketplace state assembled for the authenticated session. */
export type MarketplaceSnapshot = {
  /** Authenticated profile identifier. */
  currentUserId: string;
  /** Authenticated user's username. */
  currentUsername: string;
  /** Authenticated user's marketplace role. */
  role: Role;
  /** Buyer and seller profile data available to the session. */
  users: MarketplaceUser[];
  /** Administrator sign-in profile. */
  adminProfile: AdminProfile;
  /** All listing records accessible to the current session. */
  listings: Listing[];
  /** Listings currently available to browse. */
  liveListings: Listing[];
  /** Current user's buyer-side deals. */
  buyerDeals: BuyerDeal[];
  /** Requests received by the current seller. */
  sellerRequests: SellerRequest[];
  /** Notifications available to the current user. */
  notifications: NotificationItem[];
  /** IDs of notifications already marked as read. */
  readNotificationIds: number[];
  /** Listings in the administrator review queue. */
  reviewListings: ReviewListing[];
  /** Reports awaiting or having completed moderation. */
  listingReports: ListingReport[];
  /** Current seller's listings and their lifecycle metadata. */
  sellerListingRecords: SellerListingRecord[];
  /** Reviews associated with the current seller. */
  sellerReviews: SellerReview[];
  /** System-wide listing records for administrator screens. */
  systemListings: SystemListing[];
  /** System-wide deals for administrator screens. */
  systemDeals: SystemDeal[];
  /** Aggregate seller rating summaries. */
  sellerRatings: SellerRating[];
  /** Deal IDs the current buyer has already rated. */
  ratedDealIds: number[];
  /** Completed transaction history for the current user. */
  historyDeals: HistoryDeal[];
  /** Aggregate seller activity and chart data. */
  sellerStats: SellerStats;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  role: "buyer" | "seller" | "admin";
  residence: string | null;
  bio: string | null;
  meetup_locations: string[] | null;
  status: "active" | "deactivated" | "deleted";
};

type ListingRow = {
  id: number;
  seller_id: string;
  title: string;
  category: string;
  listing_type: "sell" | "lend" | "giveaway";
  condition: string;
  description: string;
  price: number | string | null;
  lending_duration_value: number | null;
  lending_duration_unit: string | null;
  meetup_location: string;
  photos: string[] | null;
  status: string;
  rejection_reason: string | null;
  removed_reason: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

type OfferRow = {
  id: number;
  listing_id: number;
  buyer_id: string;
  last_action_by: "buyer" | "seller" | null;
  kind: "offer" | "borrow" | "claim";
  status: string;
  price: number | string | null;
  start_at: string | null;
  end_at: string | null;
  detail: string | null;
  completed_at: string | null;
  created_at: string;
};

type RatingRow = {
  id: number;
  offer_id: number;
  buyer_id: string;
  seller_id: string;
  stars: number;
  review_text: string | null;
  seller_reply: string | null;
  replied_at: string | null;
  flagged: boolean;
  flag_reason: string | null;
  hidden: boolean;
  created_at: string;
};

type NotificationRow = {
  id: number;
  user_id: string;
  category: string;
  title: string;
  message: string;
  icon: string;
  tone: "navy" | "gold" | "green" | "red";
  action: string | null;
  read_at: string | null;
  created_at: string;
};

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="#e8eef6" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#7a8aa0" font-size="28">No photo</text></svg>',
  );

/** Categories accepted by listing creation and editing forms. */
export const LISTING_CATEGORIES = [
  "Electronics",
  "Books & Course Materials",
  "Furniture & Home",
  "Fashion & Accessories",
  "Sports & Outdoors",
  "Other",
] as const;

/** Password-strength checks displayed by account forms. */
export const passwordRules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
];

/**
 * Converts a marketplace username into the email identifier used by Supabase Auth.
 *
 * @param username Marketplace account name to normalize and convert.
 */
export function authEmailFromUsername(username: string) {
  const normalized = username.trim().toLowerCase();
  if (normalized.includes("@")) return normalized;
  // Auth rejects .local / domains with no MX (email_address_invalid). gmail.com has MX;
  // plus-addressing keeps each username unique. Login still uses username via resolve_login_email.
  const local = normalized.replace(/[^a-z0-9._+-]/g, "") || "user";
  return `g34mp+${local}@gmail.com`;
}

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function rpcMessage(error: { message: string } | null) {
  return error?.message ?? "Something went wrong. Try again.";
}

function roleUi(role: string): Role {
  if (role === "seller") return "Seller";
  if (role === "admin") return "Admin";
  return "Buyer";
}

function listingTypeUi(type: string): Listing["type"] {
  if (type === "lend") return "Lend";
  if (type === "giveaway") return "Give Away";
  return "Sell";
}

function listingTypeDb(type: Listing["type"]) {
  if (type === "Lend") return "lend";
  if (type === "Give Away") return "giveaway";
  return "sell";
}

function offerKindUi(kind: string): BuyerDeal["kind"] {
  if (kind === "borrow") return "Borrow";
  if (kind === "claim") return "Claim";
  return "Offer";
}

function unifyStoredOfferDetail(detail: string | null) {
  if (!detail) return "";
  return detail
    .replace(/^Proposed price:/i, "Offer:")
    .replace(/^Seller counter:/i, "Offer:")
    .replace(/^Seller proposed new lending dates:/i, "Borrow request:");
}

function availabilityLabel(status: string) {
  if (status === "live") return "Available";
  if (status === "pending") return "Pending review";
  if (status === "rejected") return "Rejected";
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  if (status === "lent") return "Lent";
  if (status === "given") return "Given";
  if (status === "removed") return "Removed";
  return status;
}

function listingStatusUi(status: string): SellerListingStatus {
  if (status === "pending") return "Pending";
  if (status === "live") return "Live";
  if (status === "rejected") return "Rejected";
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  if (status === "lent") return "Lent";
  if (status === "given") return "Given";
  return "Pending";
}

function systemStatusUi(status: string): SystemListing["status"] {
  if (status === "pending") return "Pending Review";
  if (status === "live") return "Live";
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  if (status === "lent") return "Lent";
  if (status === "given") return "Given";
  if (status === "rejected") return "Rejected";
  return "Removed";
}

function listingStatusForRequest(status: string): SellerRequest["listingStatus"] {
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  if (status === "lent") return "Lent";
  if (status === "given") return "Given";
  return "Available";
}

function offerStatusUi(status: string): SellerRequest["status"] {
  if (status === "accepted" || status === "completed" || status === "returned") return "Accepted";
  if (status === "declined" || status === "cancelled") return "Declined";
  if (status === "countered") return "Countered";
  return "Pending";
}

function isOpenSellerRequest(offer: OfferRow, listing: ListingRow) {
  if (offer.buyer_id === listing.seller_id) return false;
  if (!["live", "reserved"].includes(listing.status)) return false;
  return ["pending", "countered", "declined", "accepted"].includes(offer.status);
}

const HK_TIME_ZONE = "Asia/Hong_Kong";

function hongKongDateTimeToIso(value: string) {
  if (!value) return null;
  // datetime-local values from this app are wall-clock times in Hong Kong.
  if (/T\d{2}:\d{2}$/.test(value)) {
    const date = new Date(`${value}:00+08:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (/T\d{2}:\d{2}:\d{2}$/.test(value)) {
    const date = new Date(`${value}+08:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Formats a date as a local datetime string in the Asia/Hong_Kong time zone.
 *
 * @param date Date to format; defaults to the current time.
 */
export function hongKongDateTimeLocalValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: HK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

function padHongKongPart(value: number) {
  return String(value).padStart(2, "0");
}

function snapHongKongToTenMinutes(date: Date) {
  const value = hongKongDateTimeLocalValue(date);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  let year = Number(match[1]);
  let month = Number(match[2]);
  let day = Number(match[3]);
  let hour = Number(match[4]);
  let minute = Number(match[5]);
  const second = Number(match[6]);

  if (second > 0) minute += 1;
  if (minute % 10 !== 0) minute = Math.ceil(minute / 10) * 10;
  if (minute >= 60) {
    minute = 0;
    hour += 1;
  }
  if (hour >= 24) {
    hour = 0;
    const next = new Date(`${year}-${padHongKongPart(month)}-${padHongKongPart(day)}T12:00:00+08:00`);
    next.setTime(next.getTime() + 24 * 60 * 60 * 1000);
    const nextValue = hongKongDateTimeLocalValue(next);
    year = Number(nextValue.slice(0, 4));
    month = Number(nextValue.slice(5, 7));
    day = Number(nextValue.slice(8, 10));
  }

  return `${year}-${padHongKongPart(month)}-${padHongKongPart(day)}T${padHongKongPart(hour)}:${padHongKongPart(minute)}:00`;
}

/**
 * Converts a supported lending duration to milliseconds, or returns `null` if invalid.
 *
 * @param value Positive duration amount.
 * @param unit Duration unit, such as hours, days, or weeks.
 */
export function lendingDurationMs(value?: number | null, unit?: string | null) {
  if (value == null || value <= 0 || !unit) return null;
  const normalized = unit.toLowerCase();
  if (normalized === "hours") return value * 60 * 60 * 1000;
  if (normalized === "days") return value * 24 * 60 * 60 * 1000;
  if (normalized === "weeks") return value * 7 * 24 * 60 * 60 * 1000;
  return null;
}

/**
 * Formats a lending duration for display, using a singular unit when appropriate.
 *
 * @param value Duration amount.
 * @param unit Unit label to display.
 */
export function formatLendingDuration(value?: number | null, unit?: string | null) {
  if (value == null || !unit) return "";
  const label = value === 1 ? unit.replace(/s$/i, "") : unit;
  return `${value} ${label}`;
}

/**
 * Returns the listing's maximum borrow period in milliseconds, if one is set.
 *
 * @param listing Listing duration settings, when available.
 */
export function listingMaxBorrowMs(listing?: Pick<Listing, "duration" | "durationUnit"> | null) {
  if (!listing) return null;
  return lendingDurationMs(listing.duration, listing.durationUnit);
}

/**
 * Creates a default Hong Kong borrow period, capped by the listing duration.
 *
 * @param now Reference time used to calculate the suggested start.
 * @param listing Optional maximum lending duration for the listing.
 */
export function defaultBorrowPeriod(
  now = new Date(),
  listing?: Pick<Listing, "duration" | "durationUnit"> | null,
) {
  const start = snapHongKongToTenMinutes(new Date(now.getTime() + 60 * 60 * 1000));
  const startMs = new Date(`${start}+08:00`).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const maxMs = listingMaxBorrowMs(listing);
  const span = maxMs != null ? Math.min(oneDay, maxMs) : oneDay;
  const end = hongKongDateTimeLocalValue(new Date(startMs + Math.max(span, 5000)));
  return { start, end };
}

/**
 * Validates a borrow interval and returns a user-facing error, or `null` when valid.
 *
 * @param start Proposed local start date and time.
 * @param end Proposed local end date and time.
 * @param listing Optional listing duration limit to enforce.
 */
export function borrowPeriodError(
  start: string,
  end: string,
  listing?: Pick<Listing, "duration" | "durationUnit"> | null,
) {
  if (!start.trim() || !end.trim()) return "Choose both a start and end date.";
  const startIso = hongKongDateTimeToIso(start);
  const endIso = hongKongDateTimeToIso(end);
  if (!startIso || !endIso) return "Choose a valid start and end time.";
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return "Choose a valid start and end time.";
  }
  const nowSecond = Math.floor(Date.now() / 1000) * 1000;
  if (startMs < nowSecond) return "Start time cannot be in the past.";
  if (endMs < startMs + 5000) return "End time must be at least 5 seconds after the start time.";
  const maxMs = listingMaxBorrowMs(listing);
  if (maxMs != null && endMs - startMs > maxMs) {
    const label = formatLendingDuration(listing?.duration, listing?.durationUnit);
    return label
      ? `Borrow period cannot exceed ${label}.`
      : "Borrow period cannot exceed the listing maximum.";
  }
  return null;
}

function hongKongDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "Just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HK_TIME_ZONE,
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HK_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/**
 * Formats an offer, borrow request, or giveaway claim for display.
 *
 * @param input Listing action details; price is used for sales and dates for lending.
 */
export function offerDetailLabel(input: {
  type: Listing["type"] | "Sell" | "Lend" | "Give Away";
  price?: number;
  start?: string;
  end?: string;
}) {
  if (input.type === "Give Away") return "Claim: free";
  if (input.type === "Lend") {
    const start = input.start ? formatDateTime(new Date(input.start).toISOString()) : "";
    const end = input.end ? formatDateTime(new Date(input.end).toISOString()) : "";
    return `Borrow request: ${start} → ${end}`;
  }
  return `Offer: HK$${Number(input.price).toLocaleString()}`;
}

/**
 * Normalizes database offer statuses to the status vocabulary used in chat.
 *
 * @param status Database status value to normalize.
 */
export function chatOfferStatusUi(status: string | undefined | null): ChatOfferStatus | undefined {
  if (!status) return undefined;
  const value = status.toLowerCase();
  if (value === "pending") return "Pending";
  if (value === "countered") return "Countered";
  if (value === "declined" || value === "cancelled") return "Declined";
  if (
    value === "accepted" ||
    value.startsWith("accepted") ||
    value === "purchased" ||
    value === "borrowed" ||
    value.includes("reserved") ||
    value.includes("lent") ||
    value.includes("given") ||
    value === "completed" ||
    value === "returned"
  ) {
    return "Accepted";
  }
  return undefined;
}

function formatClock(iso: string) {
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HK_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function isToday(iso: string) {
  const date = new Date(iso);
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: HK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const nowKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: HK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return dateKey === nowKey;
}

const OPTIMISTIC_CHAT_ID = 1_000_000_000_000;

function notificationTone(value: string | null | undefined): NotificationItem["tone"] {
  if (value === "gold" || value === "green" || value === "red") return value;
  return "navy";
}

/**
 * Converts a database notification row into its application-facing shape.
 *
 * @param row Raw notification record returned by the database.
 */
export function notificationFromRow(row: {
  id: number;
  category: string;
  title: string;
  message: string;
  icon?: string | null;
  tone?: string | null;
  action?: string | null;
  listing_id?: number | null;
  thread_id?: number | null;
  created_at: string;
}): NotificationItem {
  return {
    id: Number(row.id),
    category: row.category,
    title: row.title,
    message: row.message,
    timestamp: formatRelative(row.created_at),
    dateGroup: isToday(row.created_at) ? "Today" : "Earlier",
    icon: row.icon || "bell",
    tone: notificationTone(row.tone),
    action: row.action ?? undefined,
    listingId: row.listing_id == null ? undefined : Number(row.listing_id),
    threadId: row.thread_id == null ? undefined : Number(row.thread_id),
  };
}

/**
 * Converts a database chat row into a message, assigning sender and offer state.
 *
 * @param row Raw chat-message record.
 * @param myRole Current user's role, used to map the sender.
 * @param myId Current user's profile ID.
 * @param offerStatus Optional normalized status for an associated offer.
 */
export function chatMessageFromRow(
  row: {
    id: number;
    sender_id: string;
    body: string;
    kind?: string | null;
    offer_id?: number | string | null;
    created_at: string;
  },
  myRole: Role,
  myId?: string,
  offerStatus?: ChatOfferStatus,
): ChatMessage {
  const mine = row.sender_id === myId;
  const sender: ChatMessage["sender"] =
    myRole === "Seller" ? (mine ? "seller" : "buyer") : mine ? "buyer" : "seller";
  const offerId = row.offer_id == null || row.offer_id === "" ? undefined : Number(row.offer_id);
  return {
    id: Number(row.id),
    sender,
    body: row.body,
    time: formatClock(row.created_at),
    kind: row.kind === "offer" ? "offer" : "message",
    offerId: Number.isFinite(offerId) ? offerId : undefined,
    offerStatus,
  };
}

/**
 * Inserts a realtime message or replaces its matching optimistic local message.
 *
 * @param list Current messages for the thread.
 * @param incoming Newly received server message.
 */
export function mergeRealtimeChatMessage(list: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (list.some((item) => item.id === incoming.id)) return list;
  const temp = [...list]
    .reverse()
    .find(
      (item) =>
        item.id > OPTIMISTIC_CHAT_ID &&
        item.body === incoming.body &&
        item.sender === incoming.sender,
    );
  if (temp) return list.map((item) => (item.id === temp.id ? incoming : item));
  return [...list, incoming];
}

function usernameOf(profiles: ProfileRow[], id: string) {
  return profiles.find((profile) => profile.id === id)?.username ?? "unknown";
}

function fullNameOf(profiles: ProfileRow[], id: string) {
  return profiles.find((profile) => profile.id === id)?.full_name ?? usernameOf(profiles, id);
}

function ratingSummary(ratings: RatingRow[], sellerId: string) {
  const visible = ratings.filter((rating) => rating.seller_id === sellerId && !rating.hidden);
  if (!visible.length) return { average: 0, count: 0 };
  const average = visible.reduce((sum, rating) => sum + rating.stars, 0) / visible.length;
  return { average, count: visible.length };
}

function placeholderListing(sellerUsername: string, title = "Completed deal"): Listing {
  return {
    id: 0,
    title,
    seller: sellerUsername,
    category: "",
    type: "Sell",
    condition: "",
    location: "",
    posted: "",
    image: PLACEHOLDER_IMAGE,
    description: "",
  };
}

function listingForRating(
  rating: RatingRow,
  offers: OfferRow[],
  listingUiById: Map<number, Listing>,
  profiles: ProfileRow[],
): Listing {
  const sellerUsername = usernameOf(profiles, rating.seller_id);
  const offer = offers.find((row) => row.id === rating.offer_id);
  if (offer) {
    const listing = listingUiById.get(offer.listing_id);
    if (listing) return listing;
  }
  return placeholderListing(sellerUsername);
}

function mapListing(row: ListingRow, profiles: ProfileRow[], ratings: RatingRow[]): Listing {
  const photos = (row.photos ?? []).filter(Boolean);
  const seller = profiles.find((profile) => profile.id === row.seller_id);
  const summary = ratingSummary(ratings, row.seller_id);
  return {
    id: row.id,
    title: row.title,
    seller: seller?.username ?? "unknown",
    category: row.category,
    type: listingTypeUi(row.listing_type),
    price: row.price == null ? undefined : Number(row.price),
    duration: row.lending_duration_value ?? undefined,
    durationUnit:
      row.lending_duration_unit === "Hours" ||
      row.lending_duration_unit === "Days" ||
      row.lending_duration_unit === "Weeks"
        ? row.lending_duration_unit
        : undefined,
    condition: row.condition,
    location: row.meetup_location,
    posted: formatRelative(row.created_at),
    image: photos[0] ?? PLACEHOLDER_IMAGE,
    images: photos,
    description: row.description,
    views: row.view_count,
    availability: availabilityLabel(row.status),
    sellerFullName: seller?.full_name,
    sellerRating: summary.count ? Number(summary.average.toFixed(1)) : undefined,
    sellerReviewCount: summary.count,
  };
}

function buyerDealStatus(offer: OfferRow, listing: ListingRow) {
  if (offer.status === "pending") return "Pending";
  if (offer.status === "countered") return "Countered";
  if (offer.status === "declined" || offer.status === "cancelled") return "Declined";
  if (offer.status === "returned") return "Returned";
  if (offer.status === "completed") return "Completed";
  if (offer.status === "accepted") {
    if (offer.kind === "borrow") return "Borrowed";
    return "Accepted";
  }
  return "Pending";
}

/**
 * Creates a buyer or seller Auth account and its profile metadata.
 *
 * @param input Account credentials, identity, role, and optional profile details.
 */
export async function registerAccount(input: {
  username: string;
  fullName: string;
  password: string;
  role: "Buyer" | "Seller";
  residence?: string;
  bio?: string;
  meetups?: string[];
}) {
  const username = input.username.trim().toLowerCase();
  if (username === "admin@ust.hk") {
    throw new Error("This username is reserved for the administrator.");
  }
  const { data: existing, error: lookupError } = await supabase.rpc("resolve_login_email", {
    p_username: username,
  });
  throwIf(lookupError);
  if (existing) {
    throw new Error("This username is already used by another account or role.");
  }

  const { error } = await supabase.auth.signUp({
    email: authEmailFromUsername(username),
    password: input.password,
    options: {
      data: {
        username,
        full_name: input.fullName.trim(),
        role: input.role.toLowerCase(),
        residence: input.residence ?? "",
        bio: input.bio ?? "",
        meetups: input.meetups ?? [],
      },
    },
  });
  if (error) {
    const code = "code" in error ? String(error.code) : "";
    if (code === "email_address_invalid" || /email address .* invalid/i.test(error.message)) {
      throw new Error(
        "Supabase rejected the sign-up email. Use a username without @ (for example mei.wong).",
      );
    }
    throw new Error(error.message);
  }
  await supabase.auth.signOut();
}

/**
 * Resolves a username, authenticates it, and verifies its active role.
 *
 * @param input Username, password, and expected marketplace role.
 */
export async function loginAccount(input: {
  username: string;
  password: string;
  expectedRole: Role;
}) {
  const username = input.username.trim().toLowerCase();
  const { data: email, error: lookupError } = await supabase.rpc("resolve_login_email", {
    p_username: username,
  });
  throwIf(lookupError);
  if (!email) {
    throw new Error(
      input.expectedRole === "Admin"
        ? "Invalid admin credentials. Use the seeded administrator account."
        : "No account matches that username.",
    );
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });
  if (signInError) {
    throw new Error(
      input.expectedRole === "Admin"
        ? "Invalid admin credentials. Use the seeded administrator account."
        : "Incorrect password. Check your credentials and try again.",
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();
  throwIf(profileError);

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("Profile was not found for this account.");
  }
  if (profile.status === "deactivated") {
    await supabase.auth.signOut();
    throw new Error("This account is deactivated. Contact an administrator for account review.");
  }
  if (profile.status === "deleted") {
    await supabase.auth.signOut();
    throw new Error("This account is no longer available.");
  }

  const role = roleUi(profile.role);
  if (role !== input.expectedRole) {
    await supabase.auth.signOut();
    if (role === "Admin") {
      throw new Error("Admin accounts cannot enter a buyer or seller dashboard. Use Admin Login.");
    }
    throw new Error(
      `Wrong role selected. @${profile.username} is registered as a ${role.toLowerCase()}.`,
    );
  }

  return { role, username: profile.username as string };
}

/** Signs out the current Supabase Auth session. */
export async function logoutAccount() {
  await supabase.auth.signOut();
}

/** Restores an active authenticated profile, signing out invalid sessions. */
export async function restoreSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.session.user.id)
    .maybeSingle();
  throwIf(error);
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return null;
  }
  return { role: roleUi(profile.role), username: profile.username as string };
}

/** Loads and maps the marketplace data required by the current session. */
export async function loadSnapshot(): Promise<MarketplaceSnapshot> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Not signed in.");

  await supabase.rpc("expire_overdue_borrows");

  const [
    profilesRes,
    listingsRes,
    offersRes,
    ratingsRes,
    notificationsRes,
    offerMessagesRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("listings").select("*").order("created_at", { ascending: false }),
    supabase.from("offers").select("*").order("created_at", { ascending: false }),
    supabase.from("ratings").select("*").order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("chat_messages")
      .select("id, offer_id, sender_id, kind, created_at")
      .eq("kind", "offer")
      .not("offer_id", "is", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("listing_reports")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  throwIf(profilesRes.error);
  throwIf(listingsRes.error);
  throwIf(offersRes.error);
  throwIf(ratingsRes.error);
  throwIf(notificationsRes.error);
  throwIf(offerMessagesRes.error);
  throwIf(reportsRes.error);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const listingRows = (listingsRes.data ?? []) as ListingRow[];
  const offers = (offersRes.data ?? []) as OfferRow[];
  const ratings = (ratingsRes.data ?? []) as RatingRow[];
  const notificationRows = (notificationsRes.data ?? []) as NotificationRow[];
  const latestOfferActor = new Map<number, string>();
  for (const message of offerMessagesRes.data ?? []) {
    if (message.offer_id != null && message.sender_id) {
      latestOfferActor.set(Number(message.offer_id), message.sender_id);
    }
  }
  const me = profiles.find((profile) => profile.id === user.id);
  if (!me) throw new Error("Profile was not found for this account.");

  const listings = listingRows.map((row) => mapListing(row, profiles, ratings));
  const listingById = new Map(listingRows.map((row) => [row.id, row]));
  const listingUiById = new Map(listings.map((listing) => [listing.id, listing]));

  const users: MarketplaceUser[] = profiles
    .filter((profile) => profile.role !== "admin" && profile.status !== "deleted")
    .map((profile) => ({
      id: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      role: profile.role === "seller" ? "Seller" : "Buyer",
      residence: profile.residence ?? undefined,
      bio: profile.bio ?? undefined,
      meetups: profile.meetup_locations ?? [],
      status: profile.status === "deactivated" ? "Deactivated" : "Active",
    }));

  const adminRow =
    profiles.find((profile) => profile.role === "admin" && profile.username === "admin@ust.hk") ??
    profiles.find((profile) => profile.role === "admin");

  const liveListings = listingRows
    .filter((row) => {
      if (row.status !== "live") return false;

      // Do not show a listing while it is reserved, on loan, sold, or given.
      // This also protects Browse against an old/stale listing status.
      return !offers.some(
        (offer) =>
          offer.listing_id === row.id &&
          ["accepted", "completed"].includes(offer.status),
      );
    })
    .map((row) => listingUiById.get(row.id)!);

  const buyerDeals: BuyerDeal[] = offers
    .filter((offer) => {
      if (offer.buyer_id !== me.id) return false;
      if (offer.status === "declined" || offer.status === "cancelled") return false;
      return true;
    })
    .map((offer): BuyerDeal | null => {
      const listingRow = listingById.get(offer.listing_id);
      const listing = listingUiById.get(offer.listing_id);
      if (!listingRow || !listing) return null;
      const status = buyerDealStatus(offer, listingRow);
      const completed = ["completed", "returned"].includes(offer.status);
      return {
        id: offer.id,
        listing,
        kind: offerKindUi(offer.kind),
        status,
        date: formatDateTime(offer.created_at),
        rawDate: offer.completed_at ?? offer.created_at,
        detail: unifyStoredOfferDetail(offer.detail),
        dueDate: offer.end_at ? formatDateTime(offer.end_at) : undefined,
        completed,
        lastActionBy: offer.last_action_by,
      } satisfies BuyerDeal;
    })
    .filter((deal): deal is BuyerDeal => Boolean(deal));

  const sellerRequests: SellerRequest[] = offers
    .filter((offer) => {
      const listing = listingById.get(offer.listing_id);
      return Boolean(listing && listing.seller_id === me.id && isOpenSellerRequest(offer, listing));
    })
    .map((offer) => {
      const listingRow = listingById.get(offer.listing_id);
      const listing = listingUiById.get(offer.listing_id);
      if (!listingRow || !listing) return null;
      return {
        id: offer.id,
        dealId: offer.id,
        listing,
        buyer: usernameOf(profiles, offer.buyer_id),
        lastActionBy:
          offer.last_action_by ??
          (latestOfferActor.get(offer.id) === listingRow.seller_id
            ? "seller"
            : latestOfferActor.get(offer.id) === offer.buyer_id
              ? "buyer"
              : null),
        type: offerKindUi(offer.kind),
        submitted: formatRelative(offer.created_at),
        detail: unifyStoredOfferDetail(offer.detail),
        status: offerStatusUi(offer.status),
        listingStatus: listingStatusForRequest(listingRow.status),
      } satisfies SellerRequest;
    })
    .filter((request): request is SellerRequest => Boolean(request));

  const notifications: NotificationItem[] = notificationRows.map((row) => notificationFromRow(row));

  const reviewListings: ReviewListing[] = listingRows.map((row) => {
    const listing = listingUiById.get(row.id)!;
    const status: ReviewListing["status"] =
      row.status === "removed"
        ? "Removed"
        : row.status === "rejected"
          ? "Rejected"
          : row.status === "pending"
            ? "Pending Review"
            : "Approved";
    return {
      id: row.id,
      listing,
      sellerFullName: fullNameOf(profiles, row.seller_id),
      submitted: formatDateTime(row.created_at),
      status,
      rejectionReason: row.rejection_reason ?? undefined,
    };
  });

  const listingReports: ListingReport[] = (reportsRes.data ?? [])
    .map((report): ListingReport | null => {
      const listing = listingUiById.get(Number(report.listing_id));
      if (!listing) return null;
      const resolution = typeof report.resolution === "string" ? report.resolution : null;
      const closed =
        resolution === "reviewed" ||
        resolution === "dismissed" ||
        report.resolved_at != null;
      return {
        id: Number(report.id),
        listing,
        reporter: usernameOf(profiles, String(report.reporter_id)),
        reason: typeof report.reason === "string" ? report.reason : "",
        submitted: formatDateTime(String(report.created_at)),
        status: closed ? "Closed" : "Pending",
        closedAs:
          resolution === "reviewed"
            ? "reviewed"
            : resolution === "dismissed" || closed
              ? "dismissed"
              : undefined,
      };
    })
    .filter((report): report is ListingReport => Boolean(report))
    .sort((a, b) => Number(a.status === "Closed") - Number(b.status === "Closed"));

  const sellerListingRecords: SellerListingRecord[] = listingRows
    .filter(
      (row) =>
        row.seller_id === me.id &&
        row.status !== "removed",
    )
    .map((row) => ({
      id: row.id,
      listing: listingUiById.get(row.id)!,
      status: listingStatusUi(row.status),
      activeOffers: offers.filter(
        (offer) => offer.listing_id === row.id && ["pending", "countered"].includes(offer.status),
      ).length,
      updated: formatRelative(row.updated_at),
      rejectionReason: row.rejection_reason ?? undefined,
    }));

  const sellerReviews: SellerReview[] = ratings.map((rating) => {
    const sellerUsername = usernameOf(profiles, rating.seller_id);
    const listing = listingForRating(rating, offers, listingUiById, profiles);
    return {
      id: rating.id,
      rating: rating.stars,
      text: rating.review_text ?? "",
      buyer: usernameOf(profiles, rating.buyer_id),
      sellerUsername,
      date: formatDateTime(rating.created_at),
      dateKey: hongKongDateKey(new Date(rating.created_at)),
      listing: { ...listing, seller: listing.seller || sellerUsername },
      reply: rating.seller_reply ?? undefined,
      repliedAt: rating.replied_at ? formatDateTime(rating.replied_at) : undefined,
      flagged: rating.flagged,
      flagReason: rating.flag_reason ?? undefined,
      hidden: rating.hidden,
    };
  });

  const systemListings: SystemListing[] = listingRows.map((row) => ({
    id: row.id,
    listing: listingUiById.get(row.id)!,
    sellerFullName: fullNameOf(profiles, row.seller_id),
    status: systemStatusUi(row.status),
    submitted: formatDateTime(row.created_at),
  }));

  const systemDeals: SystemDeal[] = offers
    .filter((offer) => ["accepted", "completed", "returned"].includes(offer.status))
    .map((offer) => {
      const listingRow = listingById.get(offer.listing_id);
      if (!listingRow) return null;
      const type: SystemDeal["type"] =
        offer.kind === "borrow" ? "Lent" : offer.kind === "claim" ? "Given" : "Sold";
      const status =
        offer.status === "accepted"
          ? "In progress"
          : offer.status === "returned"
            ? "Returned"
            : "Completed";
      return {
        id: offer.id,
        title: listingRow.title,
        buyer: usernameOf(profiles, offer.buyer_id),
        seller: usernameOf(profiles, listingRow.seller_id),
        type,
        start: formatDateTime(offer.start_at ?? offer.created_at),
        end: formatDateTime(offer.completed_at ?? offer.end_at ?? offer.created_at),
        status,
      } satisfies SystemDeal;
    })
    .filter((deal): deal is SystemDeal => Boolean(deal));

  const sellerIds = profiles.filter((profile) => profile.role === "seller");
  const sellerRatings: SellerRating[] = sellerIds
    .map((seller) => {
      const visible = ratings.filter((rating) => rating.seller_id === seller.id && !rating.hidden);
      const average = visible.length
        ? visible.reduce((sum, rating) => sum + rating.stars, 0) / visible.length
        : 0;
      const latest = visible[0]?.created_at ?? "";
      return {
        seller: seller.username,
        name: seller.full_name,
        average: Number(average.toFixed(1)),
        reviews: visible.length,
        fiveStar: visible.filter((rating) => rating.stars === 5).length,
        latest: latest ? formatDateTime(latest) : "—",
        latestAt: latest,
        listings: listingRows.filter((row) => row.seller_id === seller.id && row.status !== "removed")
          .length,
      };
    })
    .sort((a, b) => {
      const newest = Date.parse(b.latestAt) - Date.parse(a.latestAt);
      if (Number.isFinite(newest) && newest !== 0) return newest;
      if (b.latestAt && !a.latestAt) return 1;
      if (a.latestAt && !b.latestAt) return -1;
      return b.reviews - a.reviews;
    });

  const ratedDealIds = ratings
    .filter((rating) => rating.buyer_id === me.id)
    .map((rating) => rating.offer_id);

  const historyDeals: HistoryDeal[] = buyerDeals
    .filter((deal) => deal.completed)
    .map((deal) => ({
      id: deal.id,
      listing: deal.listing,
      date: hongKongDateKey(new Date(deal.rawDate ?? deal.date)),
      type:
        deal.kind === "Borrow" ? "Borrowed" : deal.kind === "Claim" ? "Received" : "Bought",
      outcome: deal.status,
    }));

  const myListings = listingRows.filter((row) => row.seller_id === me.id);
  const myOffers = offers.filter((offer) => listingById.get(offer.listing_id)?.seller_id === me.id);
  const myRatings = ratings.filter((rating) => rating.seller_id === me.id && !rating.hidden);
  const completedMine = myOffers.filter((offer) =>
    ["completed", "returned"].includes(offer.status),
  );
  const soldCount = completedMine.filter((offer) => offer.kind === "offer").length;
  const lentCount = completedMine.filter((offer) => offer.kind === "borrow").length;
  const givenCount = completedMine.filter((offer) => offer.kind === "claim").length;
  const sellerStats: SellerStats = {
    views: myListings.reduce((sum, row) => sum + row.view_count, 0),
    offers: myOffers.length,
    completed: completedMine.length,
    averageRating: myRatings.length
      ? Number(
          (myRatings.reduce((sum, rating) => sum + rating.stars, 0) / myRatings.length).toFixed(1),
        )
      : 0,
    viewsByListing: myListings.slice(0, 6).map((row) => ({ title: row.title, views: row.view_count })),
    dealsByType: [
      { label: "Sold", count: soldCount, tone: "sold" },
      { label: "Lent", count: lentCount, tone: "lent" },
      { label: "Given", count: givenCount, tone: "given" },
    ],
  };

  const historyWithDates: HistoryDeal[] = offers
    .filter((offer) => offer.buyer_id === me.id && ["completed", "returned", "declined", "cancelled"].includes(offer.status))
    .map((offer) => {
      const listing = listingUiById.get(offer.listing_id);
      if (!listing) return null;
      return {
        id: offer.id,
        listing,
        date: (offer.completed_at ?? offer.created_at).slice(0, 10),
        type: offer.kind === "borrow" ? "Borrowed" : offer.kind === "claim" ? "Received" : "Bought",
        outcome:
          offer.status === "declined"
            ? "Offer declined"
            : offer.status === "returned"
              ? "Returned"
              : offer.status === "cancelled"
                ? "Cancelled"
                : "Completed",
      } satisfies HistoryDeal;
    })
    .filter((deal): deal is HistoryDeal => Boolean(deal));

  return {
    currentUserId: me.id,
    currentUsername: me.username,
    role: roleUi(me.role),
    users,
    adminProfile: {
      username: adminRow?.username ?? "admin@ust.hk",
      password: "",
      fullName: adminRow?.full_name ?? "Marketplace Admin",
    },
    listings,
    liveListings,
    buyerDeals,
    sellerRequests,
    notifications,
    readNotificationIds: notificationRows.filter((row) => row.read_at).map((row) => row.id),
    reviewListings,
    listingReports,
    sellerListingRecords,
    sellerReviews,
    systemListings,
    systemDeals,
    sellerRatings,
    ratedDealIds,
    historyDeals: historyWithDates.length ? historyWithDates : historyDeals,
    sellerStats,
  };
}

/**
 * Updates the signed-in profile and optionally changes its password.
 *
 * @param input New full name and optional profile or password changes.
 */
export async function updateOwnProfile(input: {
  fullName: string;
  bio?: string;
  meetups?: string[];
  password?: string;
}) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim(),
      bio: input.bio ?? null,
      meetup_locations: input.meetups ?? [],
    })
    .eq("id", data.user.id);
  throwIf(error);
  if (input.password) {
    const { error: passwordError } = await supabase.auth.updateUser({ password: input.password });
    throwIf(passwordError);
  }
}

/**
 * Creates a listing for the signed-in seller or an administrator-selected seller.
 *
 * @param input Listing fields, optional seller ID, photos, and publication choice.
 */
export async function createListing(input: {
  type: Listing["type"];
  title: string;
  category: string;
  condition: string;
  description: string;
  location: string;
  price?: number;
  duration?: number;
  durationUnit?: "Hours" | "Days" | "Weeks";
  photos: string[];
  sellerId?: string;
  goLive?: boolean;
}) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in.");
  const sellerId = input.sellerId ?? data.user.id;
  const { error } = await supabase.from("listings").insert({
    seller_id: sellerId,
    title: input.title.trim(),
    category: input.category,
    listing_type: listingTypeDb(input.type),
    condition: input.condition,
    description: input.description.trim(),
    meetup_location: input.location,
    price: input.type === "Sell" ? input.price : null,
    lending_duration_value: input.type === "Lend" ? input.duration : null,
    lending_duration_unit: input.type === "Lend" ? input.durationUnit : null,
    photos: input.photos.slice(0, 6),
    status: input.goLive ? "live" : "pending",
  });
  throwIf(error);
}

/**
 * Updates editable listing fields and notifies buyers with active offers.
 *
 * @param listingId ID of the listing to update.
 * @param patch Replacement listing fields and optional photos or resubmission flag.
 */
export async function updateListingDetails(
  listingId: number,
  patch: {
    title: string;
    category: string;
    condition: string;
    location: string;
    description: string;
    photos?: string[];
    resubmit?: boolean;
  },
): Promise<number> {
  const updates: Record<string, unknown> = {
    title: patch.title.trim(),
    category: patch.category,
    condition: patch.condition,
    meetup_location: patch.location,
    description: patch.description.trim(),
  };
  if (patch.resubmit) updates.status = "pending";
  if (patch.photos) updates.photos = patch.photos.slice(0, 6);
  const { error } = await supabase.from("listings").update(updates).eq("id", listingId);
  throwIf(error);

  const { data: notified, error: notifyError } = await supabase.rpc(
    "notify_active_offer_buyers_of_listing_edit",
    { p_listing_id: listingId },
  );
  if (notifyError) {
    const missing =
      notifyError.code === "PGRST202" ||
      /could not find the function|schema cache/i.test(notifyError.message);
    if (!missing) throw new Error(rpcMessage(notifyError));
    return 0;
  }
  return Number(notified ?? 0);
}

const recentListingViews = new Map<number, number>();

/**
 * Increments a listing's view count, suppressing duplicate requests briefly.
 *
 * @param listingId ID of the viewed listing.
 */
export async function incrementViews(listingId: number) {
  const now = Date.now();
  const last = recentListingViews.get(listingId) ?? 0;
  if (now - last < 2000) return null;
  recentListingViews.set(listingId, now);
  const { data, error } = await supabase.rpc("increment_listing_views", {
    p_listing_id: listingId,
  });
  if (error) {
    recentListingViews.delete(listingId);
    return null;
  }
  return data as number;
}

/**
 * Creates a price offer, borrowing request, or giveaway claim for a listing.
 *
 * @param listing Listing receiving the buyer's action.
 * @param input Optional offer price or proposed borrowing dates.
 */
export async function submitListingAction(
  listing: Listing,
  input: { price?: number; start?: string; end?: string },
) {
  if (listing.type === "Give Away") {
    const { data, error } = await supabase.rpc("claim_giveaway", { p_listing_id: listing.id });
    if (error) throw new Error(rpcMessage(error));
    return data as number;
  }
  const { data, error } = await supabase.rpc("create_offer", {
    p_listing_id: listing.id,
    p_kind: listing.type === "Lend" ? "borrow" : "offer",
    p_price: listing.type === "Sell" ? input.price : null,
    p_start_at: listing.type === "Lend" ? hongKongDateTimeToIso(input.start ?? "") : null,
    p_end_at: listing.type === "Lend" ? hongKongDateTimeToIso(input.end ?? "") : null,
  });
  if (error) throw new Error(rpcMessage(error));
  return data as number;
}

/**
 * Best-effort sync of a saved buyer offer into its chat thread.
 *
 * @param listingId Listing associated with the offer.
 * @param body Offer text to post to chat.
 * @param offerId ID of the persisted offer.
 */
export async function postOfferChatIfBuyerThread(
  listingId: number,
  body: string,
  offerId: number,
) {
  try {
    const threadId = await openChat(listingId);
    await sendChatMessage(threadId, body, "offer", "Buyer", offerId);
  } catch {
    /* The offer row is already saved; chat sync must not fail the submit. */
  }
}

/**
 * Accepts, declines, or counters a seller request.
 *
 * @param offerId ID of the buyer's request.
 * @param action Seller response to apply.
 * @param counter Optional price or borrowing dates for a counter-offer.
 */
export async function respondToOffer(
  offerId: number,
  action: "accept" | "decline" | "counter",
  counter?: { price?: number; start?: string; end?: string },
) {
  const { error } = await supabase.rpc("respond_to_offer", {
    p_offer_id: offerId,
    p_action: action,
    p_counter_price: counter?.price ?? null,
    p_counter_start: counter?.start ? hongKongDateTimeToIso(counter.start) : null,
    p_counter_end: counter?.end ? hongKongDateTimeToIso(counter.end) : null,
  });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Sends a seller counter-offer, falling back to the generic counter RPC if needed.
 *
 * @param offerId ID of the request being countered.
 * @param offer Proposed counter price or borrowing dates.
 */
export async function sellerMakeOffer(
  offerId: number,
  offer: { price?: number; start?: string; end?: string },
) {
  const { error } = await supabase.rpc("seller_make_offer_after_decline", {
    p_offer_id: offerId,
    p_price: offer.price ?? null,
    p_start_at: offer.start ? hongKongDateTimeToIso(offer.start) : null,
    p_end_at: offer.end ? hongKongDateTimeToIso(offer.end) : null,
  });
  if (!error) return;

  const dedicatedMissing =
    error.code === "PGRST202" ||
    /could not find the function|schema cache/i.test(error.message);
  if (!dedicatedMissing) throw new Error(rpcMessage(error));

  await respondToOffer(offerId, "counter", offer);
}

/**
 * Accepts the buyer's current counter-offer.
 *
 * @param offerId ID of the counter-offer to accept.
 */
export async function acceptCounterOffer(offerId: number) {
  const { error } = await supabase.rpc("accept_counter_offer", { p_offer_id: offerId });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Accepts the current price of a listing and returns the created deal ID.
 *
 * @param listing Listing whose current price the buyer accepts.
 */
export async function acceptListingPrice(listing: Listing) {
  const { data, error } = await supabase.rpc("accept_listing_price", {
    p_listing_id: listing.id,
  });
  if (error) throw new Error(rpcMessage(error));
  return data as number;
}

/**
 * Declines the seller's current counter-offer.
 *
 * @param offerId ID of the counter-offer to decline.
 */
export async function declineCounterOffer(offerId: number) {
  const { error } = await supabase.rpc("decline_counter_offer", { p_offer_id: offerId });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Declines a pending or countered offer as the buyer.
 *
 * @param offerId ID of the buyer's offer to decline.
 */
export async function buyerDeclineOffer(offerId: number) {
  const { error } = await supabase.rpc("buyer_decline_offer", { p_offer_id: offerId });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Sends a buyer counter-offer with an optional price or borrowing interval.
 *
 * @param offerId ID of the offer being countered.
 * @param counter Proposed price or borrowing interval.
 */
export async function buyerCounterOffer(
  offerId: number,
  counter: { price?: number; start?: string; end?: string },
) {
  const { error } = await supabase.rpc("buyer_counter_offer", {
    p_offer_id: offerId,
    p_counter_price: counter.price ?? null,
    p_counter_start: counter.start ? hongKongDateTimeToIso(counter.start) : null,
    p_counter_end: counter.end ? hongKongDateTimeToIso(counter.end) : null,
  });
  if (!error) return;

  const dedicatedMissing =
    error.code === "PGRST202" ||
    /could not find the function|schema cache/i.test(error.message);
  if (!dedicatedMissing) throw new Error(rpcMessage(error));

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("listing_id,kind")
    .eq("id", offerId)
    .single();
  if (offerError) throw new Error(rpcMessage(offerError));

  const kind = offer.kind === "borrow" ? "borrow" : "offer";
  const { error: fallbackError } = await supabase.rpc("create_offer", {
    p_listing_id: offer.listing_id,
    p_kind: kind,
    p_price: counter.price ?? null,
    p_start_at: counter.start ? hongKongDateTimeToIso(counter.start) : null,
    p_end_at: counter.end ? hongKongDateTimeToIso(counter.end) : null,
  });
  if (fallbackError) throw new Error(rpcMessage(fallbackError));
}

/**
 * Marks an accepted borrowing deal as returned.
 *
 * @param offerId ID of the borrowing offer to return.
 */
export async function returnBorrow(offerId: number) {
  const { error } = await supabase.rpc("return_borrow", { p_offer_id: offerId });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Completes a deal and optionally records the buyer's rating and review.
 *
 * @param offerId ID of the deal to complete.
 * @param stars Optional star rating to submit with completion.
 * @param review Optional written review to submit with completion.
 */
export async function completeDeal(offerId: number, stars?: number, review?: string) {
  const { error } = await supabase.rpc("complete_deal", {
    p_offer_id: offerId,
    p_stars: stars ?? null,
    p_review: review ?? null,
  });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Approves, rejects, or removes a listing through the moderation RPC.
 *
 * @param listingId ID of the listing under moderation.
 * @param action Moderation decision to apply.
 * @param reason Optional written explanation for rejection or removal.
 */
export async function moderateListing(
  listingId: number,
  action: "approve" | "reject" | "remove",
  reason?: string,
) {
  const { error } = await supabase.rpc("moderate_listing", {
    p_listing_id: listingId,
    p_action: action,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Removes one of the signed-in seller's listings.
 *
 * @param listingId ID of the listing to remove.
 */
export async function sellerRemoveListing(listingId: number) {
  const { error } = await supabase.rpc("seller_remove_listing", {
    p_listing_id: listingId,
    p_reason: "Removed by seller",
  });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Updates an account's administrator-editable profile fields.
 *
 * @param userId ID of the account to update.
 * @param patch Replacement full name and optional residence.
 */
export async function adminUpdateUser(
  userId: string,
  patch: { fullName: string; residence?: string },
) {
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: patch.fullName.trim(), residence: patch.residence || null })
    .eq("id", userId);
  throwIf(error);
}

/**
 * Activates or deactivates an account through the administrator RPC.
 *
 * @param userId ID of the account to update.
 * @param status New account status.
 */
export async function adminSetUserStatus(userId: string, status: "active" | "deactivated") {
  const { error } = await supabase.rpc("set_user_status", { p_user_id: userId, p_status: status });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Soft-deletes a user account while preserving marketplace records.
 *
 * @param userId ID of the account to delete.
 */
export async function adminDeleteUser(userId: string) {
  const { error } = await supabase.rpc("soft_delete_user", { p_user_id: userId });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Submits a safety report for a listing.
 *
 * @param listingId ID of the listing being reported.
 * @param reason Optional explanation for the report.
 */
export async function reportListing(listingId: number, reason?: string) {
  const { error } = await supabase.rpc("report_listing", {
    p_listing_id: listingId,
    p_reason: reason ?? "Inappropriate or unsafe listing",
  });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Closes a listing report as reviewed or dismissed.
 *
 * @param reportId ID of the report to resolve.
 * @param resolution Resolution to record.
 */
export async function resolveListingReport(
  reportId: number,
  resolution: "reviewed" | "dismissed",
) {
  const { error } = await supabase.rpc("resolve_listing_report", {
    p_report_id: reportId,
    p_resolution: resolution,
  });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Hides or restores a seller rating using the moderation RPC.
 *
 * @param ratingId ID of the rating to moderate.
 * @param hidden Whether the rating should be hidden; defaults to `true`.
 */
export async function hideRating(ratingId: number, hidden = true) {
  const { error } = await supabase.rpc("hide_rating", { p_rating_id: ratingId, p_hidden: hidden });
  if (error) throw new Error(rpcMessage(error));
}

/**
 * Saves a seller's reply to a buyer rating.
 *
 * @param ratingId ID of the rating being answered.
 * @param reply Seller's response text.
 */
export async function replyToReview(ratingId: number, reply: string) {
  const { error } = await supabase
    .from("ratings")
    .update({ seller_reply: reply.trim() })
    .eq("id", ratingId);
  throwIf(error);
}

/**
 * Flags a rating for administrator moderation with the supplied reason.
 *
 * @param ratingId ID of the rating to flag.
 * @param reason Explanation sent to the moderation queue.
 */
export async function flagReview(ratingId: number, reason: string) {
  const { error } = await supabase
    .from("ratings")
    .update({ flagged: true, flag_reason: reason })
    .eq("id", ratingId);
  throwIf(error);
}

/**
 * Marks the specified notifications as read for the current account.
 *
 * @param ids Notification IDs to mark as read.
 */
export async function markNotificationsRead(ids: number[]) {
  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
  if (error) throw new Error(rpcMessage(error));
}

const deletedChatStorageKey = "hkust_deleted_chat_threads";

function deletedChatThreadIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(deletedChatStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value))
        : [],
    );
  } catch {
    return new Set();
  }
}

function hideDeletedChatThreadLocally(threadId: number) {
  if (typeof window === "undefined") return;
  const next = deletedChatThreadIds();
  next.add(threadId);
  window.localStorage.setItem(deletedChatStorageKey, JSON.stringify([...next]));
}

function isMissingRpc(error: { code?: string; message: string }) {
  return (
    error.code === "PGRST202" ||
    /could not find the function|schema cache/i.test(error.message)
  );
}

/**
 * Hides a chat thread for the current user and remembers the local dismissal.
 *
 * @param threadId ID of the chat thread to hide.
 */
export async function deleteChatThread(threadId: number) {
  hideDeletedChatThreadLocally(threadId);

  const { error } = await supabase.rpc("hide_chat_thread", {
    p_thread_id: threadId,
  });
  if (!error || isMissingRpc(error)) return;
  throw new Error(rpcMessage(error));
}

/** Lists visible chat threads for the authenticated account. */
export async function listMyChatThreads(): Promise<MyChatThread[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const myId = auth.user.id;
  const deletedIds = deletedChatThreadIds();
  type ThreadRow = {
    id: number;
    listing_id: number;
    buyer_id: string;
    seller_id: string;
    created_at: string;
    buyer_hidden_at?: string | null;
    seller_hidden_at?: string | null;
  };
  const withHidden = await supabase
    .from("chat_threads")
    .select("id, listing_id, buyer_id, seller_id, created_at, buyer_hidden_at, seller_hidden_at")
    .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`);
  const threadsRes =
    withHidden.error && /buyer_hidden_at|seller_hidden_at|schema cache/i.test(withHidden.error.message)
      ? await supabase
          .from("chat_threads")
          .select("id, listing_id, buyer_id, seller_id, created_at")
          .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`)
      : withHidden;
  throwIf(threadsRes.error);
  const threads = (threadsRes.data ?? []) as ThreadRow[];
  if (!threads.length) return [];

  const listingIds = [...new Set(threads.map((thread) => thread.listing_id as number))];
  const [{ data: profiles }, { data: listingRows }] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("listings").select("*").in("id", listingIds),
  ]);
  const profileRows = (profiles ?? []) as ProfileRow[];
  const listingById = new Map(
    ((listingRows ?? []) as ListingRow[]).map((row) => [row.id, mapListing(row, profileRows, [])]),
  );

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("thread_id, body, created_at")
    .in(
      "thread_id",
      threads.map((thread) => thread.id),
    )
    .order("created_at", { ascending: false });

  const lastByThread = new Map<number, { body: string; created_at: string }>();
  for (const message of messages ?? []) {
    const threadId = message.thread_id as number;
    if (!lastByThread.has(threadId)) {
      lastByThread.set(threadId, {
        body: (message.body as string) ?? "",
        created_at: message.created_at as string,
      });
    }
  }

  return threads
    .filter((thread) => {
      if (deletedIds.has(thread.id as number)) return false;
      if (thread.buyer_id === thread.seller_id) return false;
      const hidden = thread as { buyer_hidden_at?: string | null; seller_hidden_at?: string | null };
      if (thread.buyer_id === myId && hidden.buyer_hidden_at) return false;
      if (thread.seller_id === myId && hidden.seller_hidden_at) return false;
      return true;
    })
    .map((thread) => {
      const listing = listingById.get(thread.listing_id as number);
      if (!listing) return null;
      const otherId = thread.buyer_id === myId ? thread.seller_id : thread.buyer_id;
      const last = lastByThread.get(thread.id as number);
      return {
        id: thread.id as number,
        listing,
        counterparty: usernameOf(profileRows, otherId as string),
        lastMessage: last?.body ?? "",
        updated: formatRelative(last?.created_at ?? (thread.created_at as string)),
        sortKey: last?.created_at ?? (thread.created_at as string),
      };
    })
    .filter((thread): thread is NonNullable<typeof thread> => Boolean(thread))
    .sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime())
    .map(({ sortKey: _sortKey, ...thread }) => thread);
}

/**
 * Lists chat participants and their latest message for one listing.
 *
 * @param listingId ID of the listing whose chat participants are requested.
 */
export async function listListingChatPeople(listingId: number) {
  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select("id, buyer_id, seller_id, created_at")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  throwIf(error);
  if (!threads?.length) return [];
  const validThreads = threads.filter(
    (thread) => thread.buyer_id !== thread.seller_id,
  );
  if (!validThreads.length) return [];

  const { data: profiles } = await supabase.from("profiles").select("id, username");
  const usernameOfId = (id: string) => usernameOf((profiles ?? []) as ProfileRow[], id);

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("thread_id, body, created_at")
    .in(
      "thread_id",
      validThreads.map((thread) => thread.id),
    )
    .order("created_at", { ascending: false });

  const lastByThread = new Map<number, string>();
  for (const message of messages ?? []) {
    if (!lastByThread.has(message.thread_id as number)) {
      lastByThread.set(message.thread_id as number, (message.body as string) ?? "");
    }
  }

  return validThreads.map((thread) => ({
    id: `thread-${thread.id}`,
    buyer: usernameOfId(thread.buyer_id as string),
    lastMessage: lastByThread.get(thread.id as number) ?? "",
  }));
}

/**
 * Finds a chat with a username, optionally restricted to a listing.
 *
 * @param username Username of the chat participant to find.
 * @param listingId Optional listing ID used to select a matching thread.
 */
export async function findChatWithUsername(username: string, listingId?: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !username) return null;
  const myId = auth.user.id;
  const needle = username.trim();
  const { data: profiles } = await supabase.from("profiles").select("id, username");
  const other = (profiles ?? []).find(
    (profile) => (profile.username as string)?.toLowerCase() === needle.toLowerCase(),
  );
  if (!other?.id) return null;

  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select("id, listing_id, buyer_id, seller_id, created_at")
    .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`);
  throwIf(error);
  const matches = (threads ?? []).filter(
    (thread) =>
      thread.buyer_id !== thread.seller_id &&
      (thread.buyer_id === other.id || thread.seller_id === other.id),
  );
  if (!matches.length) return null;

  let thread = listingId == null
    ? matches[0]
    : (matches.find((row) => row.listing_id === listingId) ?? null);
  if (!thread) return null;
  if (matches.length > 1) {
    const { data: latest } = await supabase
      .from("chat_messages")
      .select("thread_id")
      .in(
        "thread_id",
        matches.map((row) => row.id),
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.thread_id) {
      thread = matches.find((row) => row.id === latest.thread_id) ?? thread;
    }
  }

  const { data: listingRow } = await supabase
    .from("listings")
    .select("*")
    .eq("id", thread.listing_id)
    .maybeSingle();
  if (!listingRow) return null;
  const { data: allProfiles } = await supabase.from("profiles").select("*");
  return {
    listing: mapListing(listingRow as ListingRow, (allProfiles ?? []) as ProfileRow[], []),
    participant: other.username as string,
    buyerId: thread.buyer_id as string,
  };
}

/**
 * Looks up the profile ID associated with an exact username.
 *
 * @param username Exact marketplace username to look up.
 */
export async function profileIdByUsername(username: string) {
  const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/**
 * Loads a chat thread only when the current user is one of its participants.
 *
 * @param threadId ID of the thread to open.
 */
export async function openChatThread(threadId: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: thread, error } = await supabase
    .from("chat_threads")
    .select("id, listing_id, buyer_id, seller_id")
    .eq("id", threadId)
    .maybeSingle();
  throwIf(error);
  if (!thread) return null;
  if (thread.buyer_id !== auth.user.id && thread.seller_id !== auth.user.id) return null;
  if (thread.buyer_id === thread.seller_id) return null;

  const { data: listingRow } = await supabase
    .from("listings")
    .select("*")
    .eq("id", thread.listing_id)
    .maybeSingle();
  if (!listingRow) return null;

  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileRows = (profiles ?? []) as ProfileRow[];
  const otherId = thread.buyer_id === auth.user.id ? thread.seller_id : thread.buyer_id;
  const participant = usernameOf(profileRows, otherId as string);

  return {
    listing: mapListing(listingRow as ListingRow, profileRows, []),
    participant,
    buyerId: thread.buyer_id as string,
  };
}

/**
 * Opens or creates a chat thread for a listing and optional buyer.
 *
 * @param listingId ID of the listing associated with the chat.
 * @param buyerId Optional buyer profile ID for seller-initiated chats.
 */
export async function openChat(listingId: number, buyerId?: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Please sign in again.");

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", listingId)
    .maybeSingle();
  throwIf(listingError);
  if (!listing) throw new Error("Listing not found.");
  if (
    (buyerId == null && listing.seller_id === auth.user.id) ||
    (buyerId != null && buyerId === listing.seller_id)
  ) {
    throw new Error("You cannot open a chat with yourself.");
  }

  const { data, error } = await supabase.rpc("open_chat_thread", {
    p_listing_id: listingId,
    p_buyer_id: buyerId ?? null,
  });
  if (error) throw new Error(rpcMessage(error));
  return data as number;
}

/**
 * Loads and maps all messages for a chat thread in chronological order.
 *
 * @param threadId ID of the chat thread to load.
 * @param myRole Current user's role, used to map message sender labels.
 */
export async function loadChatMessages(threadId: number, myRole: Role) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, sender_id, body, kind, created_at, offer_id")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  throwIf(error);
  const { data: user } = await supabase.auth.getUser();
  const myId = user.user?.id;
  const rows = data ?? [];
  const offerIds = [
    ...new Set(
      rows
        .map((row) => (row.offer_id == null ? null : Number(row.offer_id)))
        .filter((id): id is number => Number.isFinite(id)),
    ),
  ];
  const statusById = new Map<number, ChatOfferStatus>();
  if (offerIds.length) {
    const { data: offerRows } = await supabase.from("offers").select("id, status").in("id", offerIds);
    for (const offer of offerRows ?? []) {
      const status = chatOfferStatusUi(offer.status as string);
      if (status) statusById.set(Number(offer.id), status);
    }
  }
  return rows.map((row) => {
    const offerId = row.offer_id == null ? undefined : Number(row.offer_id);
    return chatMessageFromRow(
      row,
      myRole,
      myId,
      offerId != null ? statusById.get(offerId) : undefined,
    );
  });
}

/**
 * Persists a text message or formal offer and returns its mapped row.
 *
 * @param threadId ID of the destination thread.
 * @param body Message or offer text to save.
 * @param kind Message kind; defaults to a regular message.
 * @param myRole Current user's role; defaults to buyer.
 * @param offerId Optional associated offer ID for formal offers.
 */
export async function sendChatMessage(
  threadId: number,
  body: string,
  kind: "message" | "offer" = "message",
  myRole: Role = "Buyer",
  offerId?: number | null,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: auth.user.id,
      body,
      kind,
      ...(kind === "offer" && offerId != null ? { offer_id: offerId } : {}),
    })
    .select("id, sender_id, body, kind, created_at, offer_id")
    .single();
  throwIf(error);
  if (!data) throw new Error("Could not send message.");
  const status =
    kind === "offer" && offerId != null
      ? myRole === "Seller"
        ? "Countered"
        : "Pending"
      : undefined;
  return chatMessageFromRow(data, myRole, auth.user.id, status);
}

type NotificationChangeRow = {
  id: number;
  user_id: string;
  category: string;
  title: string;
  message: string;
  icon?: string | null;
  tone?: string | null;
  action?: string | null;
  listing_id?: number | null;
  thread_id?: number | null;
  read_at?: string | null;
  created_at: string;
};

/**
 * Subscribes to notification and offer changes for one user.
 *
 * @param userId Profile ID whose notifications and deal changes to observe.
 * @param handlers Callbacks for inserted/updated notifications and deal refreshes.
 */
export function subscribeMyNotifications(
  userId: string,
  handlers: {
    onInsert: (item: NotificationItem, read: boolean) => void;
    onUpdate: (item: NotificationItem, read: boolean) => void;
    onDealsChange?: () => void;
  },
) {
  const apply = (
    raw: unknown,
    handler: (item: NotificationItem, read: boolean) => void,
  ) => {
    if (!raw || typeof raw !== "object") return;
    const row = raw as NotificationChangeRow;
    if (row.id == null || !row.created_at) return;
    try {
      handler(notificationFromRow(row), Boolean(row.read_at));
    } catch {
      /* Realtime payload mapping must not crash the app. */
    }
  };

  let dealsTimer: number | null = null;
  const bumpDeals = () => {
    if (!handlers.onDealsChange) return;
    if (dealsTimer) window.clearTimeout(dealsTimer);
    dealsTimer = window.setTimeout(() => handlers.onDealsChange?.(), 200);
  };

  try {
    const channel = supabase
      .channel(`session:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          apply(payload.new, handlers.onInsert);
          bumpDeals();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => apply(payload.new, handlers.onUpdate),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers" },
        () => bumpDeals(),
      )
      .subscribe();

    return () => {
      if (dealsTimer) window.clearTimeout(dealsTimer);
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

type ChatChangeRow = {
  id: number;
  thread_id: number;
  sender_id: string;
  body: string;
  kind?: string | null;
  offer_id?: number | string | null;
  created_at: string;
};

/**
 * Subscribes to new messages in a chat thread and returns a cleanup callback.
 *
 * @param threadId ID of the thread to observe.
 * @param myRole Current user's role for mapping incoming senders.
 * @param myId Current user's profile ID.
 * @param onInsert Callback invoked with each valid new message.
 */
export function subscribeChatThread(
  threadId: number,
  myRole: Role,
  myId: string,
  onInsert: (message: ChatMessage) => void,
) {
  try {
    const channel = supabase
      .channel(`chat:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as ChatChangeRow;
          if (row?.id == null || !row.sender_id || !row.body || !row.created_at) return;
          try {
            onInsert(
              chatMessageFromRow(
                row,
                myRole,
                myId,
                row.kind === "offer" ? "Pending" : undefined,
              ),
            );
          } catch {
            /* Realtime payload mapping must not crash the app. */
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

const LISTING_PHOTO_BUCKET = "listing-photos";
const LISTING_PHOTO_MAX_EDGE = 1200;
const LISTING_PHOTO_QUALITY = 0.82;

async function blobFromCanvas(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Resizes and compresses a listing photo to WebP or JPEG.
 *
 * @param file Image file to resize and encode.
 */
export async function compressListingPhoto(file: File): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(file);
  }
  const scale = Math.min(1, LISTING_PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not compress that photo.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await blobFromCanvas(canvas, "image/webp", LISTING_PHOTO_QUALITY);
  if (webp && webp.size > 0 && webp.type === "image/webp") {
    return { blob: webp, ext: "webp" };
  }
  const jpeg = await blobFromCanvas(canvas, "image/jpeg", LISTING_PHOTO_QUALITY);
  if (!jpeg || jpeg.size === 0) throw new Error("Could not compress that photo.");
  return { blob: jpeg, ext: "jpg" };
}

/**
 * Compresses and uploads one listing photo, returning its public URL.
 *
 * @param file Image file to upload.
 * @param userId Profile ID used to scope the uploaded object path.
 */
export async function uploadListingPhoto(file: File, userId: string) {
  const { blob, ext } = await compressListingPhoto(file);
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(LISTING_PHOTO_BUCKET).upload(path, blob, {
    contentType: blob.type || (ext === "webp" ? "image/webp" : "image/jpeg"),
    upsert: false,
  });
  if (error) {
    throw new Error(
      error.message.includes("Bucket not found")
        ? "Could not upload photos. Run supabase/008_listing_photos_storage.sql in the SQL Editor."
        : error.message,
    );
  }
  const { data } = supabase.storage.from(LISTING_PHOTO_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Could not get a public URL for that photo.");
  return data.publicUrl;
}

/**
 * Uploads new listing photos while preserving existing public image URLs.
 *
 * @param items Photo files or existing public URLs to include in the listing.
 */
export async function uploadListingPhotos(items: { file?: File; url: string }[]) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in.");
  const userId = data.user.id;
  return Promise.all(
    items.slice(0, 6).map((item) => {
      if (item.file) return uploadListingPhoto(item.file, userId);
      if (!item.url || item.url.startsWith("blob:") || item.url.startsWith("data:")) {
        throw new Error("Photo upload failed. Try another image.");
      }
      return item.url;
    }),
  );
}
