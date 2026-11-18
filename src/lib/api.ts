import { supabase } from "./supabase";

export type Role = "Buyer" | "Seller" | "Admin";

export type MarketplaceUser = {
  id?: string;
  username: string;
  fullName: string;
  role: "Buyer" | "Seller";
  residence?: string;
  bio?: string;
  meetups?: string[];
  status?: "Active" | "Deactivated";
};

export type AdminProfile = {
  username: string;
  password: string;
  fullName: string;
};

export type Listing = {
  id: number;
  title: string;
  seller: string;
  category: string;
  type: "Sell" | "Lend" | "Give Away";
  price?: number;
  condition: string;
  location: string;
  posted: string;
  image: string;
  images?: string[];
  description: string;
  views?: number;
  availability?: string;
  sellerFullName?: string;
  sellerRating?: number;
  sellerReviewCount?: number;
};

export type ChatOfferStatus = "Pending" | "Accepted" | "Declined" | "Countered";

export type ChatMessage = {
  id: number;
  sender: "buyer" | "seller";
  body: string;
  time: string;
  kind?: "message" | "offer";
  offerId?: number;
  offerStatus?: ChatOfferStatus;
};

export type MyChatThread = {
  id: number;
  listing: Listing;
  counterparty: string;
  lastMessage: string;
  updated: string;
};

export type BuyerDeal = {
  id: number;
  listing: Listing;
  kind: "Offer" | "Borrow" | "Claim";
  status: string;
  date: string;
  detail: string;
  dueDate?: string;
  completed?: boolean;
};

export type SellerRequest = {
  id: number;
  dealId: number;
  listing: Listing;
  buyer: string;
  type: "Offer" | "Borrow" | "Claim";
  submitted: string;
  detail: string;
  status: "Pending" | "Accepted" | "Declined" | "Countered";
  listingStatus: "Available" | "Reserved" | "Sold" | "Lent" | "Given";
};

export type NotificationItem = {
  id: number;
  category: string;
  title: string;
  message: string;
  timestamp: string;
  dateGroup: "Today" | "Earlier";
  icon: string;
  tone: "navy" | "gold" | "green" | "red";
  action?: string;
};

export type ReviewListing = {
  id: number;
  listing: Listing;
  sellerFullName: string;
  submitted: string;
  status: "Pending Review" | "Approved" | "Rejected";
  rejectionReason?: string;
};

export type SellerListingStatus =
  | "Pending"
  | "Live"
  | "Rejected"
  | "Reserved"
  | "Sold"
  | "Lent"
  | "Given";

export type SellerListingRecord = {
  id: number;
  listing: Listing;
  status: SellerListingStatus;
  activeOffers: number;
  updated: string;
  rejectionReason?: string;
};

export type SellerReview = {
  id: number;
  rating: number;
  text: string;
  buyer: string;
  sellerUsername: string;
  date: string;
  listing: Listing;
  reply?: string;
  repliedAt?: string;
  flagged?: boolean;
  flagReason?: string;
};

export type SystemListing = {
  id: number;
  listing: Listing;
  sellerFullName: string;
  status:
    | "Pending Review"
    | "Live"
    | "Reserved"
    | "Sold"
    | "Lent"
    | "Given"
    | "Rejected"
    | "Removed";
  submitted: string;
};

export type SystemDeal = {
  id: number;
  title: string;
  buyer: string;
  seller: string;
  type: "Sold" | "Lent" | "Given";
  start: string;
  end: string;
  status: string;
};

export type SellerRating = {
  seller: string;
  name: string;
  average: number;
  reviews: number;
  fiveStar: number;
  latest: string;
  listings: number;
};

export type HistoryDeal = {
  id: number;
  listing: Listing;
  date: string;
  type: "Bought" | "Borrowed" | "Received";
  outcome: string;
};

export type SellerStats = {
  views: number;
  offers: number;
  completed: number;
  averageRating: number;
  viewsByListing: { title: string; views: number }[];
  dealsByType: { label: string; count: number; tone: string }[];
};

export type MarketplaceSnapshot = {
  currentUserId: string;
  currentUsername: string;
  role: Role;
  users: MarketplaceUser[];
  adminProfile: AdminProfile;
  listings: Listing[];
  liveListings: Listing[];
  buyerDeals: BuyerDeal[];
  sellerRequests: SellerRequest[];
  notifications: NotificationItem[];
  readNotificationIds: number[];
  reviewListings: ReviewListing[];
  sellerListingRecords: SellerListingRecord[];
  sellerReviews: SellerReview[];
  systemListings: SystemListing[];
  systemDeals: SystemDeal[];
  sellerRatings: SellerRating[];
  ratedDealIds: number[];
  historyDeals: HistoryDeal[];
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

export const passwordRules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
];

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
  if (status === "accepted") return "Accepted";
  if (status === "declined" || status === "cancelled") return "Declined";
  if (status === "countered") return "Countered";
  return "Pending";
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-HK", { dateStyle: "medium" }).format(date);
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function offerDetailLabel(input: {
  type: Listing["type"] | "Sell" | "Lend";
  price?: number;
  start?: string;
  end?: string;
}) {
  if (input.type === "Lend") {
    const start = input.start ? formatDateTime(new Date(input.start).toISOString()) : "";
    const end = input.end ? formatDateTime(new Date(input.end).toISOString()) : "";
    return `Borrow request: ${start} → ${end}`;
  }
  return `Offer: HK$${Number(input.price).toLocaleString()}`;
}

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
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function isToday(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

const OPTIMISTIC_CHAT_ID = 1_000_000_000_000;

function notificationTone(value: string | null | undefined): NotificationItem["tone"] {
  if (value === "gold" || value === "green" || value === "red") return value;
  return "navy";
}

export function notificationFromRow(row: {
  id: number;
  category: string;
  title: string;
  message: string;
  icon?: string | null;
  tone?: string | null;
  action?: string | null;
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
  };
}

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
  if (offer.kind === "offer") return listing.status === "sold" ? "Purchased" : "Accepted · Reserved";
  if (offer.kind === "borrow") return "Borrowed";
  return listing.status === "given" ? "Ready to collect" : "Accepted · Given";
}

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

export async function logoutAccount() {
  await supabase.auth.signOut();
}

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

export async function loadSnapshot(): Promise<MarketplaceSnapshot> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Not signed in.");

  await supabase.rpc("expire_overdue_borrows");

  const [profilesRes, listingsRes, offersRes, ratingsRes, notificationsRes] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("listings").select("*").order("created_at", { ascending: false }),
    supabase.from("offers").select("*").order("created_at", { ascending: false }),
    supabase.from("ratings").select("*").order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  throwIf(profilesRes.error);
  throwIf(listingsRes.error);
  throwIf(offersRes.error);
  throwIf(ratingsRes.error);
  throwIf(notificationsRes.error);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const listingRows = (listingsRes.data ?? []) as ListingRow[];
  const offers = (offersRes.data ?? []) as OfferRow[];
  const ratings = (ratingsRes.data ?? []) as RatingRow[];
  const notificationRows = (notificationsRes.data ?? []) as NotificationRow[];
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
    .filter((row) => row.status === "live")
    .map((row) => listingUiById.get(row.id)!);

  const buyerDeals: BuyerDeal[] = offers
    .filter((offer) => offer.buyer_id === me.id)
    .map((offer) => {
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
        detail: unifyStoredOfferDetail(offer.detail),
        dueDate: offer.end_at ? formatDateTime(offer.end_at) : undefined,
        completed,
      } satisfies BuyerDeal;
    })
    .filter((deal): deal is BuyerDeal => Boolean(deal));

  const sellerRequests: SellerRequest[] = offers
    .filter((offer) => listingById.get(offer.listing_id)?.seller_id === me.id)
    .map((offer) => {
      const listingRow = listingById.get(offer.listing_id);
      const listing = listingUiById.get(offer.listing_id);
      if (!listingRow || !listing) return null;
      return {
        id: offer.id,
        dealId: offer.id,
        listing,
        buyer: usernameOf(profiles, offer.buyer_id),
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
      row.status === "rejected" ? "Rejected" : row.status === "pending" ? "Pending Review" : "Approved";
    return {
      id: row.id,
      listing,
      sellerFullName: fullNameOf(profiles, row.seller_id),
      submitted: formatDateTime(row.created_at),
      status,
      rejectionReason: row.rejection_reason ?? undefined,
    };
  });

  const sellerListingRecords: SellerListingRecord[] = listingRows
    .filter((row) => row.seller_id === me.id && row.status !== "removed")
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

  const sellerReviews: SellerReview[] = ratings
    .filter((rating) => !rating.hidden)
    .map((rating) => {
      const sellerUsername = usernameOf(profiles, rating.seller_id);
      const listing = listingForRating(rating, offers, listingUiById, profiles);
      return {
        id: rating.id,
        rating: rating.stars,
        text: rating.review_text ?? "",
        buyer: usernameOf(profiles, rating.buyer_id),
        sellerUsername,
        date: formatDateTime(rating.created_at),
        listing: { ...listing, seller: listing.seller || sellerUsername },
        reply: rating.seller_reply ?? undefined,
        repliedAt: rating.replied_at ? formatDateTime(rating.replied_at) : undefined,
        flagged: rating.flagged,
        flagReason: rating.flag_reason ?? undefined,
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
  const sellerRatings: SellerRating[] = sellerIds.map((seller) => {
    const visible = ratings.filter((rating) => rating.seller_id === seller.id && !rating.hidden);
    const average = visible.length
      ? visible.reduce((sum, rating) => sum + rating.stars, 0) / visible.length
      : 0;
    const latest = visible[0]?.created_at;
    return {
      seller: seller.username,
      name: seller.full_name,
      average: Number(average.toFixed(1)),
      reviews: visible.length,
      fiveStar: visible.filter((rating) => rating.stars === 5).length,
      latest: latest ? formatDateTime(latest) : "—",
      listings: listingRows.filter((row) => row.seller_id === seller.id && row.status !== "removed")
        .length,
    };
  });

  const ratedDealIds = ratings
    .filter((rating) => rating.buyer_id === me.id)
    .map((rating) => rating.offer_id);

  const historyDeals: HistoryDeal[] = buyerDeals
    .filter((deal) => deal.completed)
    .map((deal) => ({
      id: deal.id,
      listing: deal.listing,
      date: new Date().toISOString().slice(0, 10),
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
) {
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
}

const recentListingViews = new Map<number, number>();

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
    p_start_at: listing.type === "Lend" && input.start ? new Date(input.start).toISOString() : null,
    p_end_at: listing.type === "Lend" && input.end ? new Date(input.end).toISOString() : null,
  });
  if (error) throw new Error(rpcMessage(error));
  return data as number;
}

export async function postOfferChatIfBuyerThread(
  listingId: number,
  body: string,
  offerId: number,
) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", auth.user.id)
      .maybeSingle();
    if (!thread?.id) return;
    await sendChatMessage(thread.id, body, "offer", "Buyer", offerId);
  } catch {
    /* The offer row is already saved; chat sync must not fail the submit. */
  }
}

export async function respondToOffer(
  offerId: number,
  action: "accept" | "decline" | "counter",
  counter?: { price?: number; start?: string; end?: string },
) {
  const { error } = await supabase.rpc("respond_to_offer", {
    p_offer_id: offerId,
    p_action: action,
    p_counter_price: counter?.price ?? null,
    p_counter_start: counter?.start ? new Date(counter.start).toISOString() : null,
    p_counter_end: counter?.end ? new Date(counter.end).toISOString() : null,
  });
  if (error) throw new Error(rpcMessage(error));
}

export async function acceptCounterOffer(offerId: number) {
  const { error } = await supabase.rpc("accept_counter_offer", { p_offer_id: offerId });
  if (error) throw new Error(rpcMessage(error));
}

export async function declineCounterOffer(offerId: number) {
  const { error } = await supabase.rpc("decline_counter_offer", { p_offer_id: offerId });
  if (error) throw new Error(rpcMessage(error));
}

export async function returnBorrow(offerId: number) {
  const { error } = await supabase.rpc("return_borrow", { p_offer_id: offerId });
  if (error) throw new Error(rpcMessage(error));
}

export async function completeDeal(offerId: number, stars?: number, review?: string) {
  const { error } = await supabase.rpc("complete_deal", {
    p_offer_id: offerId,
    p_stars: stars ?? null,
    p_review: review ?? null,
  });
  if (error) throw new Error(rpcMessage(error));
}

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

export async function sellerRemoveListing(listingId: number) {
  const { error } = await supabase.rpc("seller_remove_listing", {
    p_listing_id: listingId,
    p_reason: "Removed by seller",
  });
  if (error) throw new Error(rpcMessage(error));
}

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

export async function adminSetUserStatus(userId: string, status: "active" | "deactivated") {
  const { error } = await supabase.rpc("set_user_status", { p_user_id: userId, p_status: status });
  if (error) throw new Error(rpcMessage(error));
}

export async function adminDeleteUser(userId: string) {
  const { error } = await supabase.rpc("soft_delete_user", { p_user_id: userId });
  if (error) throw new Error(rpcMessage(error));
}

export async function reportListing(listingId: number, reason?: string) {
  const { error } = await supabase.rpc("report_listing", {
    p_listing_id: listingId,
    p_reason: reason ?? "Inappropriate or unsafe listing",
  });
  if (error) throw new Error(rpcMessage(error));
}

export async function hideRating(ratingId: number, hidden = true) {
  const { error } = await supabase.rpc("hide_rating", { p_rating_id: ratingId, p_hidden: hidden });
  if (error) throw new Error(rpcMessage(error));
}

export async function replyToReview(ratingId: number, reply: string) {
  const { error } = await supabase
    .from("ratings")
    .update({ seller_reply: reply.trim(), replied_at: new Date().toISOString() })
    .eq("id", ratingId);
  throwIf(error);
}

export async function flagReview(ratingId: number, reason: string) {
  const { error } = await supabase
    .from("ratings")
    .update({ flagged: true, flag_reason: reason })
    .eq("id", ratingId);
  throwIf(error);
}

export async function markNotificationsRead(ids: number[]) {
  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
  if (error) throw new Error(rpcMessage(error));
}

export async function listMyChatThreads(): Promise<MyChatThread[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const myId = auth.user.id;
  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select("id, listing_id, buyer_id, seller_id, created_at")
    .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`);
  throwIf(error);
  if (!threads?.length) return [];

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

export async function listListingChatPeople(listingId: number) {
  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select("id, buyer_id, created_at")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  throwIf(error);
  if (!threads?.length) return [];

  const { data: profiles } = await supabase.from("profiles").select("id, username");
  const usernameOfId = (id: string) =>
    (profiles ?? []).find((profile) => profile.id === id)?.username ?? "buyer";

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("thread_id, body, created_at")
    .in(
      "thread_id",
      threads.map((thread) => thread.id),
    )
    .order("created_at", { ascending: false });

  const lastByThread = new Map<number, string>();
  for (const message of messages ?? []) {
    if (!lastByThread.has(message.thread_id as number)) {
      lastByThread.set(message.thread_id as number, (message.body as string) ?? "");
    }
  }

  return threads.map((thread) => ({
    id: `thread-${thread.id}`,
    buyer: usernameOfId(thread.buyer_id as string),
    lastMessage: lastByThread.get(thread.id as number) ?? "",
  }));
}

export async function findChatWithUsername(username: string) {
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
    (thread) => thread.buyer_id === other.id || thread.seller_id === other.id,
  );
  if (!matches.length) return null;

  let thread = matches[0];
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

export async function profileIdByUsername(username: string) {
  const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function openChat(listingId: number, buyerId?: string) {
  const { data, error } = await supabase.rpc("open_chat_thread", {
    p_listing_id: listingId,
    p_buyer_id: buyerId ?? null,
  });
  if (error) throw new Error(rpcMessage(error));
  return data as number;
}

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
  read_at?: string | null;
  created_at: string;
};

export function subscribeMyNotifications(
  userId: string,
  handlers: {
    onInsert: (item: NotificationItem, read: boolean) => void;
    onUpdate: (item: NotificationItem, read: boolean) => void;
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

  try {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => apply(payload.new, handlers.onInsert),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => apply(payload.new, handlers.onUpdate),
      )
      .subscribe();

    return () => {
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
