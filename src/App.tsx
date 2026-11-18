import { useEffect, useMemo, useState } from "react";
import * as api from "./lib/api";
import { passwordRules } from "./lib/api";

type Role = api.Role;
type AuthView = "login" | "buyer-register" | "seller-register" | "admin-login";
type MarketplaceUser = api.MarketplaceUser;
type AdminProfile = api.AdminProfile;
type Listing = api.Listing;

type ChatMessage = {
  id: number;
  sender: "buyer" | "seller";
  body: string;
  time: string;
  kind?: "message" | "offer";
  offerStatus?: "Pending" | "Accepted" | "Countered";
};

type ListingOfferItem = {
  id: number | string;
  buyer: string;
  type: string;
  detail: string;
  status: string;
};

function chatOffersForListing(
  listing: Listing,
  messages: ChatMessage[],
  buyerName: string,
): ListingOfferItem[] {
  return messages
    .filter((message) => message.kind === "offer")
    .map((message) => ({
      id: `chat-${message.id}`,
      buyer: buyerName || (message.sender === "buyer" ? "buyer" : listing.seller),
      type: /borrow/i.test(message.body) ? "Borrow" : "Offer",
      detail: message.body
        .replace(/^Formal offer:\s*/i, "Proposed price: ")
        .replace(/^Formal counter:\s*/i, "Counter: ")
        .replace(/^Seller counter:\s*/i, "Counter: "),
      status: message.offerStatus ?? "Pending",
    }));
}

function latestOffersByBuyer(offers: ListingOfferItem[]) {
  const latest = new Map<string, ListingOfferItem>();
  for (const offer of offers) {
    latest.set(offer.buyer.trim().toLowerCase(), offer);
  }
  return [...latest.values()];
}

function mergeListingOffers(primary: ListingOfferItem[], extra: ListingOfferItem[]) {
  return latestOffersByBuyer([...primary.slice().reverse(), ...extra]);
}

function withListingChatPeople(
  offers: ListingOfferItem[],
  people: { id: string; buyer: string; lastMessage: string }[],
) {
  const seen = new Set(offers.map((offer) => offer.buyer.trim().toLowerCase()));
  return [
    ...offers,
    ...people
      .filter((person) => person.buyer && !seen.has(person.buyer.trim().toLowerCase()))
      .map((person) => ({
        id: person.id,
        buyer: person.buyer,
        type: "Chat",
        detail: person.lastMessage || "Conversation started",
        status: "Chat",
      })),
  ];
}

const navByRole: Record<Role, { label: string; icon: string }[]> = {
  Buyer: [
    { label: "Browse", icon: "grid" },
    { label: "My Deals", icon: "bag" },
    { label: "Deal History", icon: "clock" },
    { label: "Rate Sellers", icon: "star" },
    { label: "Notifications", icon: "bell" },
    { label: "Profile", icon: "user" },
  ],
  Seller: [
    { label: "Create Listing", icon: "plus" },
    { label: "My Listings", icon: "grid" },
    { label: "Offers / Requests", icon: "inbox" },
    { label: "Stats", icon: "chart" },
    { label: "Reviews", icon: "star" },
    { label: "Notifications", icon: "bell" },
    { label: "Profile", icon: "user" },
  ],
  Admin: [
    { label: "Listing Review", icon: "check" },
    { label: "All Listings", icon: "grid" },
    { label: "All Users", icon: "users" },
    { label: "All Deals", icon: "bag" },
    { label: "Ratings Overview", icon: "star" },
    { label: "Notifications", icon: "bell" },
    { label: "Profile", icon: "user" },
  ],
};

const iconPaths: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M4 14h5l2 2h2l2-2h5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3Z" />,
  check: (
    <>
      <path d="m5 12 4 4L19 6" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 4a4 4 0 0 1 0 8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  pin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />,
  arrow: <path d="m5 12 14 0m-5-5 5 5-5 5" />,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function Logo() {
  return (
    <div className="logo-lockup">
      <div className="logo-mark">
        <span>科</span>
      </div>
      <div>
        <strong>HKUST</strong>
        <small>MARKETPLACE</small>
      </div>
    </div>
  );
}

function isUsableListingPhoto(src?: string) {
  return Boolean(src) && !src.startsWith("data:image/svg");
}

function ListingPhoto({
  src,
  alt,
  onLoad,
  onError,
}: {
  src?: string;
  alt: string;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!isUsableListingPhoto(src) || failed) {
    return (
      <div className="listing-photo-empty" role="img" aria-label="No preview available.">
        <span>No preview available.</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onLoad={onLoad}
      onError={() => {
        setFailed(true);
        onError?.();
      }}
    />
  );
}

function ListingCard({ listing, onOpen }: { listing: Listing; onOpen: () => void }) {
  return (
    <article className="listing-card" onClick={onOpen}>
      <div className="listing-image">
        <ListingPhoto src={listing.image} alt={listing.title} />
        <span className={`type-badge ${listing.type.replace(" ", "-").toLowerCase()}`}>
          {listing.type}
        </span>
      </div>
      <div className="listing-body">
        <div className="card-topline">
          <span>{listing.category}</span>
          <span className="available-dot">{listing.availability ?? "Available"}</span>
        </div>
        <h3>{listing.title}</h3>
        <p className="seller">by @{listing.seller}</p>
        <div className="price-line">
          <strong>
            {listing.price
              ? `HK$${listing.price.toLocaleString()}`
              : listing.type === "Lend"
                ? "Borrow"
                : "Free"}
          </strong>
          <span>{listing.condition}</span>
        </div>
        <div className="location-line">
          <span>
            <Icon name="pin" size={14} />
            {listing.location}
          </span>
          <span>{listing.posted}</span>
        </div>
      </div>
    </article>
  );
}

function Browse({
  listings,
  onOpen,
}: {
  listings: Listing[];
  onOpen: (listing: Listing) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [category, setCategory] = useState("All categories");
  const [priceRange, setPriceRange] = useState("Any price");
  const [condition, setCondition] = useState("Any condition");
  const [sort, setSort] = useState("Newest");

  const filtered = useMemo(() => {
    const result = listings.filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.seller} ${item.description}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesType = type === "All types" || item.type === type;
      const matchesCategory =
        category === "All categories" ||
        item.category === category ||
        (category === "Books" && item.category.toLowerCase().includes("book"));
      const price = item.price ?? 0;
      const matchesPrice =
        priceRange === "Any price" ||
        (priceRange === "Under HK$500" && price < 500) ||
        (priceRange.includes("500") && priceRange.includes("2,000") && price >= 500 && price <= 2000) ||
        (priceRange === "Over HK$2,000" && price > 2000);
      const matchesCondition =
        condition === "Any condition" ||
        item.condition.toLowerCase() === condition.toLowerCase();
      return matchesQuery && matchesType && matchesCategory && matchesPrice && matchesCondition;
    });
    if (sort === "Price: low to high") {
      return [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    }
    if (sort === "Price: high to low") {
      return [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    if (sort === "Oldest") {
      return [...result].reverse();
    }
    return result;
  }, [listings, query, type, category, priceRange, condition, sort]);

  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">STUDENT MARKETPLACE</p>
          <h1>Find what you need, right on campus.</h1>
          <p>Buy, borrow, or pick up pre-loved items from the HKUST community.</p>
        </div>
        <div className="trust-note">
          <span>✓</span>
          <div>
            <strong>Campus community only</strong>
            <small>Meet safely at designated HKUST locations</small>
          </div>
        </div>
      </section>

      <section className="search-panel">
        <label className="search-box">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings, categories, or sellers..."
          />
        </label>
        <button className="search-button">Search</button>
      </section>

      <section className="browse-heading">
        <div>
          <h2>Browse marketplace</h2>
          <p>{filtered.length} active listings from the HKUST community</p>
        </div>
        <div className="sort-control">
          <span>Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Newest</option>
            <option>Oldest</option>
            <option>Price: low to high</option>
            <option>Price: high to low</option>
          </select>
        </div>
      </section>

      <div className="filter-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All categories</option>
          <option>Electronics</option>
          <option>Books & Course Materials</option>
          <option>Furniture & Home</option>
          <option>Fashion & Accessories</option>
          <option>Sports & Outdoors</option>
          <option>Other</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>All types</option>
          <option>Sell</option>
          <option>Lend</option>
          <option>Give Away</option>
        </select>
        <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
          <option>Any price</option>
          <option>Under HK$500</option>
          <option>HK$500–2,000</option>
          <option>Over HK$2,000</option>
        </select>
        <select value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option>Any condition</option>
          <option>New</option>
          <option>Like New</option>
          <option>Used</option>
          <option>For Parts</option>
        </select>
      </div>

      {filtered.length ? (
        <div className="listing-grid">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onOpen={() => onOpen(listing)} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="search" size={28} />
          <h3>No listings found</h3>
          <p>Try changing your search or filters.</p>
        </div>
      )}
    </>
  );
}

function DetailModal({
  listing,
  role,
  currentUsername,
  listingOffers,
  onClose,
  onAction,
  onChat,
  onViewSeller,
}: {
  listing: Listing;
  role: Role;
  currentUsername: string;
  listingOffers: ListingOfferItem[];
  onClose: () => void;
  onAction: (message: string) => void;
  onChat: (participant?: string) => void;
  onViewSeller: () => void;
}) {
  const photos = (
    listing.images?.length ? listing.images : listing.image ? [listing.image] : []
  ).slice(0, 6);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(() => isUsableListingPhoto(photos[0]));
  const [detailLoading, setDetailLoading] = useState(true);
  const [actionOpen, setActionOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [adminStep, setAdminStep] = useState<"approve" | "reject" | "remove" | null>(null);
  const [adminReason, setAdminReason] = useState("");
  const [adminError, setAdminError] = useState("");

  const [viewCount, setViewCount] = useState(listing.views ?? 0);
  const [photoZoomed, setPhotoZoomed] = useState(false);
  const currentPhoto = photos[photoIndex];
  const canZoomPhoto = isUsableListingPhoto(currentPhoto);
  const isOwnListing = listing.seller === currentUsername;

  useEffect(() => {
    setAdminStep(null);
    setAdminReason("");
    setAdminError("");
    setPhotoZoomed(false);
    const timer = window.setTimeout(() => {
      setDetailLoading(false);
      void api.incrementViews(listing.id).then((count) => {
        if (typeof count === "number") setViewCount(count);
      });
    }, 260);
    return () => {
      window.clearTimeout(timer);
    };
  }, [listing.id]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (photoZoomed) {
        setPhotoZoomed(false);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [photoZoomed, onClose]);

  const selectPhoto = (index: number) => {
    if (index === photoIndex) return;
    setImageLoading(isUsableListingPhoto(photos[index]));
    setPhotoIndex(index);
  };

  const submitTypeAction = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (listing.type === "Sell") {
      const amount = Number(offerPrice);
      if (!amount || amount <= 0) {
        setFormError("Enter a valid offer amount.");
        return;
      }
    }

    if (listing.type === "Lend") {
      if (!startDate || !endDate) {
        setFormError("Choose both a start and end date.");
        return;
      }
      if (new Date(endDate).getTime() - new Date(startDate).getTime() < 5000) {
        setFormError("End time must be at least 5 seconds after the start time.");
        return;
      }
    }

    setSubmitting(true);
    void api
      .submitListingAction(listing, {
        price: listing.type === "Sell" ? Number(offerPrice) : undefined,
        start: startDate,
        end: endDate,
      })
      .then(() => {
        const message =
          listing.type === "Sell"
            ? `Offer of HK$${Number(offerPrice).toLocaleString()} sent to @${listing.seller}`
            : `Borrow request sent to @${listing.seller}`;
        onAction(message);
      })
      .catch((err) => {
        setSubmitting(false);
        setFormError(err instanceof Error ? err.message : "Could not submit.");
      });
  };

  const openAction = () => {
    if (listing.type === "Give Away") {
      setSubmitting(true);
      void api
        .submitListingAction(listing, {})
        .then(() => onAction(`Claim request sent to @${listing.seller}`))
        .catch((err) => {
          setSubmitting(false);
          setFormError(err instanceof Error ? err.message : "This giveaway is no longer available.");
        });
      return;
    }
    setActionOpen(true);
  };

  const runAdminModeration = (action: "approve" | "reject" | "remove") => {
    if (action !== "approve" && adminReason.trim().length < 10) {
      setAdminError("Provide a clear reason of at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setAdminError("");
    void api
      .moderateListing(listing.id, action, action === "approve" ? undefined : adminReason.trim())
      .then(() => {
        const verb = action === "approve" ? "approved" : action === "reject" ? "rejected" : "taken down";
        onAction(`Listing ${verb}. @${listing.seller} was notified.`);
      })
      .catch((err) => {
        setSubmitting(false);
        setAdminError(err instanceof Error ? err.message : "Could not update listing.");
      });
  };

  if (detailLoading) {
    return (
      <div className="modal-backdrop" onMouseDown={onClose}>
        <div
          className="detail-modal detail-loading"
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Loading listing details"
        >
          <div className="detail-loading-photo skeleton" />
          <div className="detail-loading-copy">
            <span className="skeleton skeleton-line short" />
            <span className="skeleton skeleton-line title" />
            <span className="skeleton skeleton-line price" />
            <span className="skeleton skeleton-line" />
            <span className="skeleton skeleton-line" />
            <span className="skeleton skeleton-block" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="detail-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-detail-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        <div className="detail-gallery">
          {photos.length ? (
            <>
              <div className={`detail-photo ${imageLoading ? "is-loading" : ""}`}>
                {imageLoading && <span className="image-loader" aria-label="Loading image" />}
                {canZoomPhoto ? (
                  <button
                    type="button"
                    className="detail-photo-open"
                    onClick={() => setPhotoZoomed(true)}
                    aria-label="View full photo"
                  >
                    <ListingPhoto
                      key={currentPhoto}
                      src={currentPhoto}
                      alt={`${listing.title}, photo ${photoIndex + 1} of ${photos.length}`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  </button>
                ) : (
                  <ListingPhoto
                    key={currentPhoto}
                    src={currentPhoto}
                    alt={`${listing.title}, photo ${photoIndex + 1} of ${photos.length}`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                )}
                <span className={`type-badge ${listing.type.replace(" ", "-").toLowerCase()}`}>
                  {listing.type}
                </span>
                <span className="photo-count">
                  {photoIndex + 1} / {photos.length}
                </span>
                {photos.length > 1 && (
                  <>
                    <button
                      className="gallery-arrow previous"
                      aria-label="Previous photo"
                      onClick={() => selectPhoto((photoIndex - 1 + photos.length) % photos.length)}
                    >
                      <Icon name="chevron" size={19} />
                    </button>
                    <button
                      className="gallery-arrow next"
                      aria-label="Next photo"
                      onClick={() => selectPhoto((photoIndex + 1) % photos.length)}
                    >
                      <Icon name="chevron" size={19} />
                    </button>
                  </>
                )}
              </div>
              <div className="thumbnail-strip" aria-label="Listing photos">
                {photos.map((photo, index) => (
                  <button
                    key={photo}
                    className={index === photoIndex ? "active" : ""}
                    onClick={() => selectPhoto(index)}
                    aria-label={`View photo ${index + 1}`}
                    aria-current={index === photoIndex}
                  >
                    <ListingPhoto src={photo} alt="" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <ListingPhoto alt="No preview available." />
          )}
        </div>
        <div className="detail-content">
          <div className="detail-meta">
            <span>
              {listing.category} · {listing.type}
            </span>
            <span className="available-dot">{listing.availability ?? "Available"}</span>
          </div>
          <h2 id="listing-detail-title">{listing.title}</h2>
          <div className="price-and-views">
            <div className="detail-price">
              {listing.price
                ? `HK$${listing.price.toLocaleString()}`
                : listing.type === "Lend"
                  ? "Available to borrow"
                  : "Free"}
            </div>
            <span className="view-count">Viewed {viewCount} times</span>
          </div>
          <div className="description-block">
            <small>DESCRIPTION</small>
            <p className="detail-description">{listing.description}</p>
          </div>
          <dl className="detail-facts">
            <div>
              <dt>Condition</dt>
              <dd>{listing.condition}</dd>
            </div>
            <div>
              <dt>Meetup</dt>
              <dd>{listing.location}</dd>
            </div>
            <div>
              <dt>Posted</dt>
              <dd>{listing.posted}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>{listing.availability ?? "Available"}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{listing.category}</dd>
            </div>
            <div>
              <dt>Listing type</dt>
              <dd>{listing.type}</dd>
            </div>
          </dl>
          <button
            className="seller-block"
            onClick={onViewSeller}
            aria-label={`View ${listing.seller}'s seller profile`}
          >
            <div className="avatar">{listing.seller.slice(0, 1).toUpperCase()}</div>
            <div className="seller-copy">
              <small>SELLER</small>
              <strong>
                {listing.seller.replace(".", " ")} · @{listing.seller}
              </strong>
              <span
                aria-label={`Rated ${listing.sellerRating ?? 0} out of 5 stars`}
              >
                ★★★★★ <b>{listing.sellerRating ?? "—"}</b> · {listing.sellerReviewCount ?? 0} reviews
              </span>
            </div>
            <span className="seller-link">
              View profile <Icon name="chevron" size={14} />
            </span>
          </button>

          {role !== "Admin" && !isOwnListing && actionOpen && listing.type !== "Give Away" && (
            <form className="request-form" onSubmit={submitTypeAction}>
              <div className="request-form-heading">
                <div>
                  <strong>{listing.type === "Sell" ? "Make an offer" : "Request to borrow"}</strong>
                  <small>
                    {listing.type === "Sell"
                      ? "The seller can accept, decline, or counter."
                      : "Minimum duration is 5 seconds for testing."}
                  </small>
                </div>
                <button type="button" onClick={() => setActionOpen(false)} aria-label="Close form">
                  <Icon name="x" size={16} />
                </button>
              </div>
              {listing.type === "Sell" ? (
                <label>
                  Offer amount (HK$)
                  <div className="money-input">
                    <span>HK$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={offerPrice}
                      onChange={(event) => setOfferPrice(event.target.value)}
                      placeholder={String(Math.max(1, Math.round((listing.price ?? 100) * 0.9)))}
                      autoFocus
                    />
                  </div>
                </label>
              ) : (
                <div className="date-fields">
                  <label>
                    Start date & time
                    <input
                      type="datetime-local"
                      step="1"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                    />
                  </label>
                  <label>
                    End date & time
                    <input
                      type="datetime-local"
                      step="1"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                    />
                  </label>
                </div>
              )}
              {formError && <p className="form-error">{formError}</p>}
              <button className="primary-action request-submit" disabled={submitting}>
                {submitting
                  ? "Sending..."
                  : listing.type === "Sell"
                    ? "Send Offer / Bid"
                    : "Send Borrow Request"}
              </button>
            </form>
          )}

          {role === "Admin" ? (
            <>
              {adminStep === "approve" && (
                <div className="request-form">
                  <div className="request-form-heading">
                    <div>
                      <strong>Approve this listing?</strong>
                      <small>
                        “{listing.title}” will become Available and @{listing.seller} will be
                        notified.
                      </small>
                    </div>
                    <button type="button" onClick={() => setAdminStep(null)} aria-label="Close">
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                  {adminError && <p className="form-error">{adminError}</p>}
                  <div className="detail-actions">
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => setAdminStep(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary-action"
                      disabled={submitting}
                      onClick={() => runAdminModeration("approve")}
                    >
                      <Icon name="check" size={15} />
                      {submitting ? "Approving…" : "Approve listing"}
                    </button>
                  </div>
                </div>
              )}
              {(adminStep === "reject" || adminStep === "remove") && (
                <form
                  className="request-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    runAdminModeration(adminStep);
                  }}
                >
                  <div className="request-form-heading">
                    <div>
                      <strong>
                        {adminStep === "reject" ? "Reject this listing?" : "Take down this listing?"}
                      </strong>
                      <small>@{listing.seller} will be notified with your written reason.</small>
                    </div>
                    <button type="button" onClick={() => setAdminStep(null)} aria-label="Close">
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                  <label>
                    Written reason <span>Required</span>
                    <textarea
                      rows={4}
                      value={adminReason}
                      onChange={(event) => {
                        setAdminReason(event.target.value);
                        setAdminError("");
                      }}
                      placeholder="Be specific and actionable..."
                      autoFocus
                    />
                    <small>{adminReason.length} characters · minimum 10</small>
                  </label>
                  {adminError && <p className="form-error">{adminError}</p>}
                  <div className="detail-actions">
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => setAdminStep(null)}
                    >
                      Cancel
                    </button>
                    <button className="destructive-action" disabled={submitting}>
                      {submitting
                        ? "Saving…"
                        : adminStep === "reject"
                          ? "Reject and notify"
                          : "Take down and notify"}
                    </button>
                  </div>
                </form>
              )}
              {!adminStep && listing.availability === "Pending review" && (
                <div className="detail-actions">
                  <button
                    className="request-decline"
                    onClick={() => {
                      setAdminReason("");
                      setAdminError("");
                      setAdminStep("reject");
                    }}
                  >
                    Reject
                  </button>
                  <button
                    className="primary-action"
                    onClick={() => {
                      setAdminError("");
                      setAdminStep("approve");
                    }}
                  >
                    <Icon name="check" size={15} />
                    Approve
                  </button>
                </div>
              )}
              {!adminStep &&
                (listing.availability === "Available" || listing.availability === "Reserved") && (
                  <div className="detail-actions">
                    <button
                      className="request-decline"
                      onClick={() => {
                        setAdminReason("");
                        setAdminError("");
                        setAdminStep("remove");
                      }}
                    >
                      Take down
                    </button>
                  </div>
                )}
            </>
          ) : isOwnListing ? (
            <div className="listing-offers">
              <div className="listing-offers-heading">
                <small>OFFERS / REQUESTS</small>
                <span>
                  {listingOffers.length} {listingOffers.length === 1 ? "item" : "items"}
                </span>
              </div>
              {listingOffers.length ? (
                <div className="listing-offers-list">
                  {listingOffers.map((offer) => (
                    <article className="listing-offer-row" key={offer.id}>
                      <div className="listing-offer-copy">
                        <strong>@{offer.buyer}</strong>
                        <small>
                          {offer.type} · {offer.status}
                        </small>
                        {offer.detail && <p>{offer.detail}</p>}
                      </div>
                      <button
                        type="button"
                        className="deal-text-action"
                        onClick={() => onChat(offer.buyer)}
                      >
                        <Icon name="message" size={16} /> Open chat
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="listing-offers-empty">No offers or requests on this listing yet.</p>
              )}
            </div>
          ) : (
            <>
              {listingOffers.length > 0 && (
                <div className="listing-offers">
                  <div className="listing-offers-heading">
                    <small>{listingOffers.length === 1 ? "YOUR OFFER" : "YOUR OFFERS"}</small>
                    <span>
                      {listingOffers.length} {listingOffers.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="listing-offers-list">
                    {listingOffers.map((offer) => (
                      <article className="listing-offer-row" key={offer.id}>
                        <div className="listing-offer-copy">
                          <strong>@{offer.buyer}</strong>
                          <small>
                            {offer.type} · {offer.status}
                          </small>
                          {offer.detail && <p>{offer.detail}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              <div className="detail-actions">
                <button className="primary-action" onClick={openAction} disabled={submitting}>
                  {submitting
                    ? "Sending..."
                    : listing.type === "Sell"
                      ? "Send Offer / Bid"
                      : listing.type === "Lend"
                        ? "Request to Borrow"
                        : "Claim Item"}
                  <Icon name="arrow" size={18} />
                </button>
                <button className="secondary-action" onClick={() => onChat()}>
                  <Icon name="message" size={18} />
                  Chat
                </button>
              </div>
              <button
                className="report-link"
                onClick={() => {
                  const reason = window.prompt(
                    "Why are you reporting this listing?",
                    "Inappropriate or unsafe listing",
                  );
                  if (!reason) return;
                  void api
                    .reportListing(listing.id, reason)
                    .then(() => onAction("Listing reported to administrators"))
                    .catch((err) =>
                      onAction(err instanceof Error ? err.message : "Could not send report."),
                    );
                }}
              >
                Report Listing
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    {photoZoomed && canZoomPhoto ? (
      <div
        className="photo-lightbox"
        onMouseDown={() => setPhotoZoomed(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Full listing photo"
      >
        <button
          className="photo-lightbox-close"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => setPhotoZoomed(false)}
          aria-label="Close photo"
        >
          <Icon name="x" />
        </button>
        <img
          src={currentPhoto}
          alt={`${listing.title}, full photo ${photoIndex + 1} of ${photos.length}`}
          onMouseDown={(event) => event.stopPropagation()}
        />
      </div>
    ) : null}
    </>
  );
}

function SellerProfileModal({
  seller,
  fullName,
  users,
  reviews,
  listings,
  sellerRatings,
  onClose,
  onOpenListing,
}: {
  seller: string;
  fullName: string;
  users: MarketplaceUser[];
  reviews: SellerReview[];
  listings: Listing[];
  sellerRatings: SellerRating[];
  onClose: () => void;
  onOpenListing: (listing: Listing) => void;
}) {
  const account = users.find((user) => user.username === seller && user.role === "Seller");
  const ratingSummary = sellerRatings.find((rating) => rating.seller === seller);
  const profileListings = listings.filter((listing) => listing.seller === seller);
  const profileReviews = reviews.filter(
    (review) => review.sellerUsername === seller || review.listing.seller === seller,
  );
  const reviewAverage = profileReviews.length
    ? profileReviews.reduce((sum, review) => sum + review.rating, 0) / profileReviews.length
    : 0;
  const average = ratingSummary?.average ?? reviewAverage;
  const reviewCount = ratingSummary?.reviews ?? profileReviews.length;
  const meetupLocations = account?.meetups?.length
    ? account.meetups
    : [...new Set(profileListings.map((listing) => listing.location))];
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="public-seller-profile"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-profile-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close seller profile">
          <Icon name="x" />
        </button>

        <header className="public-seller-header">
          <div className="public-seller-avatar">{initials}</div>
          <div>
            <p className="eyebrow">VERIFIED CAMPUS SELLER</p>
            <h2 id="seller-profile-title">{fullName}</h2>
            <p>@{seller}</p>
          </div>
          <div className="public-seller-rating">
            {reviewCount ? (
              <>
                <strong>{average.toFixed(1)}</strong>
                <span aria-label={`${average.toFixed(1)} out of 5 stars`}>★★★★★</span>
                <small>
                  {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </small>
              </>
            ) : (
              <>
                <strong>New</strong>
                <small>No reviews yet</small>
              </>
            )}
          </div>
        </header>

        <div className="public-seller-body">
          <section className="public-seller-about">
            <div>
              <small>ABOUT</small>
              <p>
                {account?.bio ??
                  `${fullName} is an HKUST community seller offering items for campus pickup.`}
              </p>
            </div>
            <div>
              <small>PREFERRED MEETUP LOCATIONS</small>
              <div className="public-seller-meetups">
                {meetupLocations.map((location) => (
                  <span key={location}>
                    <Icon name="pin" size={13} />
                    {location}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="public-seller-section">
            <div className="public-seller-section-heading">
              <div>
                <h3>Active listings</h3>
                <p>
                  {profileListings.length} {profileListings.length === 1 ? "item" : "items"} from @
                  {seller}
                </p>
              </div>
            </div>
            {profileListings.length ? (
              <div className="public-seller-listings">
                {profileListings.map((listing) => (
                  <button
                    key={listing.id}
                    className="public-seller-listing"
                    onClick={() => onOpenListing(listing)}
                  >
                    <img src={listing.image} alt="" />
                    <span>
                      <strong>{listing.title}</strong>
                      <small>
                        {listing.price
                          ? `HK$${listing.price.toLocaleString()}`
                          : listing.type === "Lend"
                            ? "Available to borrow"
                            : "Free"}
                      </small>
                    </span>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="public-seller-empty">This seller has no active listings.</p>
            )}
          </section>

          <section className="public-seller-section">
            <div className="public-seller-section-heading">
              <div>
                <h3>Recent reviews</h3>
                <p>Feedback from completed marketplace deals</p>
              </div>
            </div>
            {profileReviews.length ? (
              <div className="public-seller-reviews">
                {profileReviews.slice(0, 3).map((review) => (
                  <article key={review.id}>
                    <div>
                      <strong>{"★".repeat(review.rating)}</strong>
                      <span>@{review.buyer}</span>
                      <time>{review.date}</time>
                    </div>
                    <p>“{review.text}”</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="public-seller-empty">No written reviews yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ChatScreen({
  listing,
  role,
  threadId,
  counterparty,
  activeOfferId,
  messages,
  onMessagesChange,
  onBack,
  onOpenListing,
  onRefresh,
  onAction,
}: {
  listing: Listing;
  role: Role;
  threadId: number | null;
  counterparty: string;
  activeOfferId: number | null;
  messages: ChatMessage[];
  onMessagesChange: (
    messages: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[]),
  ) => void;
  onBack: () => void;
  onOpenListing: (listing: Listing) => void;
  onRefresh: () => Promise<unknown>;
  onAction: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offerError, setOfferError] = useState("");
  const currentSender = role === "Seller" ? "seller" : "buyer";
  const latestFormalId = [...messages].filter((message) => message.kind === "offer").at(-1)?.id;
  const sendingCounter =
    role === "Seller" ||
    [...messages].filter((message) => message.kind === "offer").at(-1)?.sender === "seller";

  const visibleMessages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return messages;
    return messages.filter((message) => message.body.toLowerCase().includes(normalized));
  }, [messages, query]);

  const sendOptimistic = (message: Omit<ChatMessage, "id" | "time">, kind: "message" | "offer") => {
    if (threadId == null) return;
    const tempId = Date.now();
    const temp: ChatMessage = {
      ...message,
      id: tempId,
      time: new Intl.DateTimeFormat("en-HK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date()),
    };
    onMessagesChange((current) => [...current, temp]);
    void api
      .sendChatMessage(threadId, message.body, kind, role)
      .then((saved) => {
        onMessagesChange((current) => {
          if (current.some((item) => item.id === saved.id)) {
            return current.filter((item) => item.id !== tempId);
          }
          return current.map((item) =>
            item.id === tempId ? { ...saved, offerStatus: item.offerStatus } : item,
          );
        });
      })
      .catch((err) => {
        onMessagesChange((current) => current.filter((item) => item.id !== tempId));
        onAction(err instanceof Error ? err.message : "Could not send message.");
      });
  };

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || threadId == null) return;
    setDraft("");
    sendOptimistic({ sender: currentSender, body, kind: "message" }, "message");
  };

  const sendFormalOffer = (event: React.FormEvent) => {
    event.preventDefault();
    setOfferError("");
    const formatDate = (date: string) =>
      new Intl.DateTimeFormat("en-HK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(date));

    let body = "";
    if (listing.type === "Sell") {
      if (!Number(offerPrice) || Number(offerPrice) <= 0) {
        setOfferError("Enter a valid offer amount.");
        return;
      }
      body = `${sendingCounter ? "Formal counter" : "Formal offer"}: HK$${Number(offerPrice).toLocaleString()}`;
    } else if (listing.type === "Lend") {
      if (!startDate || !endDate) {
        setOfferError("Choose both a start and end time.");
        return;
      }
      if (new Date(endDate).getTime() - new Date(startDate).getTime() < 5000) {
        setOfferError("End time must be at least 5 seconds after the start time.");
        return;
      }
      body = sendingCounter
        ? `Formal counter: ${formatDate(startDate)} to ${formatDate(endDate)}`
        : `Borrow request: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    } else {
      return;
    }

    sendOptimistic(
      {
        sender: currentSender,
        body,
        kind: "offer",
        offerStatus: "Pending",
      },
      "offer",
    );

    if (threadId != null) {
      if (role === "Seller" && activeOfferId) {
        void api
          .respondToOffer(activeOfferId, "counter", {
            price: listing.type === "Sell" ? Number(offerPrice) : undefined,
            start: startDate,
            end: endDate,
          })
          .then(() => onRefresh())
          .catch((err) =>
            setOfferError(err instanceof Error ? err.message : "Could not send counter."),
          );
      } else if (role === "Buyer") {
        void api
          .submitListingAction(listing, {
            price: listing.type === "Sell" ? Number(offerPrice) : undefined,
            start: startDate,
            end: endDate,
          })
          .then(() => onRefresh())
          .catch((err) =>
            setOfferError(err instanceof Error ? err.message : "Could not send offer."),
          );
      }
    }

    setOfferOpen(false);
    setOfferPrice("");
    setStartDate("");
    setEndDate("");
    onAction(
      sendingCounter
        ? "Formal counter sent"
        : listing.type === "Sell"
          ? "Formal offer sent"
          : "Borrow request sent",
    );
  };

  return (
    <section className="chat-screen">
      <div className="chat-page-heading">
        <button className="chat-back" onClick={onBack}>
          <Icon name="chevron" size={18} />
          Back to marketplace
        </button>
        <div className="private-thread">
          <span>PRIVATE THREAD</span>
          Only you and @{counterparty} can see this conversation
        </div>
      </div>

      <div className="chat-shell">
        <header className="chat-header">
          <div className="chat-person">
            <div className="avatar">{counterparty.slice(0, 1).toUpperCase()}</div>
            <div>
              <h1>@{counterparty}</h1>
              <span>
                <i /> Active recently
              </span>
            </div>
          </div>
          <label className="chat-search">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chat history..."
              aria-label="Search chat history"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <Icon name="x" size={14} />
              </button>
            )}
          </label>
        </header>

        <button
          type="button"
          className="chat-listing-context"
          onClick={() => onOpenListing(listing)}
        >
          <img src={listing.image} alt="" />
          <div>
            <span>CONVERSATION ABOUT · {listing.type.toUpperCase()}</span>
            <strong>{listing.title}</strong>
            <small>
              {listing.price ? `HK$${listing.price.toLocaleString()}` : listing.type} ·{" "}
              {listing.condition} · {listing.location}
            </small>
          </div>
          <span className="available-dot">{listing.availability ?? "Available"}</span>
        </button>

        <div className="message-history" aria-live="polite">
          <div className="history-date">
            <span>Today</span>
          </div>
          {query && (
            <div className="search-summary">
              {visibleMessages.length} {visibleMessages.length === 1 ? "message" : "messages"}{" "}
              matching “{query}”
            </div>
          )}
          {visibleMessages.length ? (
            visibleMessages.map((message) => (
              <div
                className={`message-row ${message.sender === currentSender ? "mine" : "theirs"}`}
                key={message.id}
              >
                {message.sender !== currentSender && (
                  <div className="avatar message-avatar">
                    {counterparty.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div
                    className={`message-bubble ${message.kind === "offer" ? "formal" : ""} ${
                      message.kind === "offer" && message.id !== latestFormalId ? "stale" : ""
                    }`}
                  >
                    {message.kind === "offer" && (
                      <span className="formal-label">
                        <Icon name="bag" size={14} /> FORMAL{" "}
                        {/counter/i.test(message.body)
                          ? "COUNTER"
                          : listing.type === "Sell"
                            ? "OFFER"
                            : "BORROW REQUEST"}
                      </span>
                    )}
                    <p>{message.body}</p>
                    {message.kind === "offer" && (
                      <span className="offer-status">
                        {message.id !== latestFormalId
                          ? "No longer valid"
                          : (message.offerStatus ?? "Current")}
                      </span>
                    )}
                  </div>
                  <time>
                    {message.sender === currentSender ? "You" : `@${counterparty}`} · {message.time}
                  </time>
                </div>
              </div>
            ))
          ) : (
            <div className="chat-empty">
              <Icon name="search" size={24} />
              <strong>No messages found</strong>
              <span>Try a different word or clear your search.</span>
            </div>
          )}
        </div>

        {offerOpen && listing.type !== "Give Away" && (
          <form className="chat-offer-panel" onSubmit={sendFormalOffer}>
            <div className="chat-offer-heading">
              <div>
                <span>FORMAL ACTION</span>
                <strong>
                  {sendingCounter
                    ? listing.type === "Sell"
                      ? "Send a counter"
                      : "Counter the lending period"
                    : listing.type === "Sell"
                      ? "Make an offer"
                      : "Request a lending period"}
                </strong>
                <small>This will be saved as part of the chat history.</small>
              </div>
              <button
                type="button"
                onClick={() => setOfferOpen(false)}
                aria-label="Close offer form"
              >
                <Icon name="x" size={17} />
              </button>
            </div>
            {listing.type === "Sell" ? (
              <label className="chat-offer-field">
                Your offer
                <div className="money-input">
                  <span>HK$</span>
                  <input
                    type="number"
                    min="1"
                    value={offerPrice}
                    onChange={(event) => setOfferPrice(event.target.value)}
                    placeholder="Enter amount"
                    autoFocus
                  />
                </div>
              </label>
            ) : (
              <div className="chat-date-fields">
                <label>
                  Start date & time
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </label>
                <label>
                  End date & time
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </label>
              </div>
            )}
            {offerError && <p className="form-error">{offerError}</p>}
            <div className="chat-offer-buttons">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setOfferOpen(false)}
              >
                Cancel
              </button>
              <button className="primary-action">
                Send formal {sendingCounter ? "counter" : listing.type === "Sell" ? "offer" : "request"}
              </button>
            </div>
          </form>
        )}

        <div className="chat-composer">
          {listing.type !== "Give Away" && (
            <button className="offer-trigger" onClick={() => setOfferOpen(!offerOpen)}>
              <Icon name="bag" size={17} />
              {sendingCounter ? "Send counter" : "Make Offer"}
            </button>
          )}
          <form onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Message @${counterparty}...`}
              aria-label={`Message ${counterparty}`}
            />
            <button className="chat-send" disabled={!draft.trim()} aria-label="Send message">
              Send <Icon name="arrow" size={17} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

const pageData: Record<string, { title: string; subtitle: string }> = {
  "My Deals": { title: "My deals", subtitle: "Track your active purchases, loans, and claims." },
  "Deal History": {
    title: "Deal history",
    subtitle: "Review your completed marketplace activity.",
  },
  Notifications: {
    title: "Notifications",
    subtitle: "Stay updated on offers, listings, and marketplace activity.",
  },
  Profile: { title: "Manage profile", subtitle: "Keep your account details accurate and secure." },
  "Create Listing": {
    title: "Create a new listing",
    subtitle: "Choose a listing type and share your item with campus.",
  },
  "My Listings": {
    title: "My listings",
    subtitle: "Manage your live, pending, and completed listings.",
  },
  "Offers / Requests": {
    title: "Offers & requests",
    subtitle: "Review and respond to incoming buyer requests.",
  },
  Stats: { title: "Seller stats", subtitle: "Understand how your listings are performing." },
  Reviews: { title: "Reviews & feedback", subtitle: "See buyer feedback and reply to reviews." },
  "Listing Review": {
    title: "Listing review",
    subtitle: "Approve or reject new marketplace submissions.",
  },
  "All Listings": {
    title: "All listings",
    subtitle: "Manage every listing across the marketplace.",
  },
  "All Users": { title: "All users", subtitle: "Manage buyer and seller accounts." },
  "All Deals": { title: "All deals", subtitle: "Review system-wide marketplace transactions." },
  "Ratings Overview": {
    title: "Seller ratings",
    subtitle: "Review ratings submitted across the community.",
  },
};

type BuyerDeal = {
  id: number;
  listing: Listing;
  kind: "Offer" | "Borrow" | "Claim";
  status: string;
  date: string;
  detail: string;
  dueDate?: string;
  completed?: boolean;
};

function RatingDialog({
  deal,
  onClose,
  onSubmit,
}: {
  deal: BuyerDeal;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="rating-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (!rating) {
            setError("Choose a star rating before submitting.");
            return;
          }
          onSubmit(rating, review);
        }}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        <p className="eyebrow">DEAL COMPLETE</p>
        <h2>Rate your experience</h2>
        <p className="rating-intro">
          How was your deal with <strong>@{deal.listing.seller}</strong> for{" "}
          <strong>{deal.listing.title}</strong>?
        </p>
        <div className="rating-stars" aria-label="Choose a rating from 1 to 5 stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className={star <= rating ? "selected" : ""}
              onClick={() => {
                setRating(star);
                setError("");
              }}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
        <label>
          Written review <span>Optional</span>
          <textarea
            rows={4}
            value={review}
            onChange={(event) => setReview(event.target.value)}
            placeholder="Share a brief, helpful review of the seller..."
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="rating-actions">
          <button type="button" className="secondary-action" onClick={onClose}>
            Not now
          </button>
          <button className="primary-action">Submit review</button>
        </div>
      </form>
    </div>
  );
}

function RateSellersPage({
  deals,
  ratedDealIds,
  onRatedDealIdsChange,
  onOpenListing,
  onAction,
  onRefresh,
}: {
  deals: BuyerDeal[];
  ratedDealIds: number[];
  onRatedDealIdsChange: (ids: number[]) => void;
  onOpenListing: (listing: Listing) => void;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const [ratingDeal, setRatingDeal] = useState<BuyerDeal | null>(null);
  const completedDeals = deals.filter((deal) => deal.completed);
  const pendingReviews = completedDeals.filter((deal) => !ratedDealIds.includes(deal.id));

  return (
    <section>
      <div className="page-title deals-page-title">
        <div>
          <p className="eyebrow">BUYER PORTAL</p>
          <h1>Rate sellers</h1>
          <p>Share feedback for sellers after a completed marketplace deal.</p>
        </div>
        <div className="deal-summary">
          <span>
            <strong>{pendingReviews.length}</strong> To review
          </span>
          <span>
            <strong>{ratedDealIds.length}</strong> Submitted
          </span>
        </div>
      </div>

      {completedDeals.length ? (
        <div className="rate-seller-list">
          {completedDeals.map((deal) => {
            const rated = ratedDealIds.includes(deal.id);
            return (
              <article className="rate-seller-card" key={deal.id}>
                <button
                  className="rate-seller-image"
                  onClick={() => onOpenListing(deal.listing)}
                  aria-label={`Open ${deal.listing.title}`}
                >
                  <img src={deal.listing.image} alt={deal.listing.title} />
                </button>
                <div className="rate-seller-copy">
                  <span>COMPLETED DEAL · {deal.date}</span>
                  <h2>{deal.listing.title}</h2>
                  <p>
                    Seller <strong>@{deal.listing.seller}</strong> · {deal.listing.type}
                  </p>
                </div>
                <div className="rate-seller-action">
                  {rated ? (
                    <span className="review-submitted-badge">
                      <Icon name="check" size={14} />
                      Review submitted
                    </span>
                  ) : (
                    <button className="primary-action" onClick={() => setRatingDeal(deal)}>
                      <Icon name="star" size={15} />
                      Rate seller
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="star" size={28} />
          <h3>No sellers to rate yet</h3>
          <p>Completed purchases, loans, and claims will appear here for review.</p>
        </div>
      )}

      {ratingDeal && (
        <RatingDialog
          deal={ratingDeal}
          onClose={() => setRatingDeal(null)}
          onSubmit={(rating, review) => {
            void api
              .completeDeal(ratingDeal.id, rating, review)
              .then(() => onRefresh())
              .then(() => {
                onRatedDealIdsChange([...ratedDealIds, ratingDeal.id]);
                onAction(`${rating}★ review submitted for @${ratingDeal.listing.seller}`);
                setRatingDeal(null);
              })
              .catch((err) =>
                onAction(err instanceof Error ? err.message : "Could not submit review."),
              );
          }}
        />
      )}
    </section>
  );
}

function MyDealsPage({
  deals,
  onDealsChange,
  onOpenListing,
  onChatListing,
  onAction,
  onRefresh,
}: {
  deals: BuyerDeal[];
  onDealsChange: (deals: BuyerDeal[]) => void;
  onOpenListing: (listing: Listing) => void;
  onChatListing: (listing: Listing, participant?: string) => void;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const [ratingDeal, setRatingDeal] = useState<BuyerDeal | null>(null);
  const [tab, setTab] = useState<"Active" | "Chats" | "Completed">("Active");
  const [chats, setChats] = useState<api.MyChatThread[]>([]);
  const activeDeals = deals.filter((deal) => !deal.completed);
  const completedDeals = deals.filter((deal) => deal.completed);

  useEffect(() => {
    let cancelled = false;
    void api
      .listMyChatThreads()
      .then((threads) => {
        if (!cancelled) setChats(threads);
      })
      .catch(() => {
        if (!cancelled) setChats([]);
      });
    return () => {
      cancelled = true;
    };
  }, [deals]);

  const markReturned = (deal: BuyerDeal) => {
    void api
      .returnBorrow(deal.id)
      .then(() => onRefresh())
      .then(() => onAction(`${deal.listing.title} marked as returned`))
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not return item."));
  };

  const acceptCounter = (deal: BuyerDeal) => {
    void api
      .acceptCounterOffer(deal.id)
      .then(() => onRefresh())
      .then(() => onAction(`${deal.listing.title} counter offer accepted`))
      .catch((err) =>
        onAction(err instanceof Error ? err.message : "Could not accept counter offer."),
      );
  };

  const dealCard = (deal: BuyerDeal) => (
    <article className={`deal-card ${deal.completed ? "deal-completed" : ""}`} key={deal.id}>
      <button className="deal-image" onClick={() => onOpenListing(deal.listing)}>
        <img src={deal.listing.image} alt={deal.listing.title} />
        <span className={`type-badge ${deal.listing.type.replace(" ", "-").toLowerCase()}`}>
          {deal.listing.type}
        </span>
      </button>
      <div className="deal-main">
        <div className="deal-title-row">
          <div>
            <span className="deal-kind">
              {deal.kind} · @{deal.listing.seller}
            </span>
            <h3>{deal.listing.title}</h3>
          </div>
          <span className={`deal-status status-${deal.status.toLowerCase().replace(/\s+/g, "-")}`}>
            {deal.status}
          </span>
        </div>
        <p className="deal-detail">{deal.detail}</p>
        <div className="deal-meta">
          <span>
            <Icon name="clock" size={14} />
            {deal.date}
          </span>
          <span>
            <Icon name="pin" size={14} />
            {deal.listing.location}
          </span>
          {deal.dueDate && (
            <span className="due-date">
              <Icon name="clock" size={14} />
              Due {deal.dueDate}
            </span>
          )}
        </div>
        <div className="deal-actions">
          <button className="deal-text-action" onClick={() => onOpenListing(deal.listing)}>
            View listing
          </button>
          <button className="deal-text-action" onClick={() => onChatListing(deal.listing)}>
            <Icon name="message" size={15} /> Open chat
          </button>
          <span />
          {deal.kind === "Borrow" && !deal.completed && (
            <button className="secondary-action" onClick={() => markReturned(deal)}>
              Return early
            </button>
          )}
          {deal.status === "Countered" && !deal.completed && (
            <button className="primary-action" onClick={() => acceptCounter(deal)}>
              Accept Counter
            </button>
          )}
          {(deal.kind === "Claim" ||
            (deal.kind !== "Claim" && deal.status.startsWith("Accepted"))) &&
            !deal.completed && (
              <button className="primary-action" onClick={() => setRatingDeal(deal)}>
                Mark as Complete
              </button>
            )}
        </div>
      </div>
    </article>
  );

  return (
    <section>
      <div className="page-title deals-page-title">
        <div>
          <p className="eyebrow">BUYER PORTAL</p>
          <h1>My deals</h1>
          <p>Track offers, borrowing periods, claims, and completed marketplace deals.</p>
        </div>
        <div className="deal-summary">
          <span>
            <strong>{activeDeals.length}</strong> Active
          </span>
          <span>
            <strong>{chats.length}</strong> Chats
          </span>
          <span>
            <strong>{completedDeals.length}</strong> Completed
          </span>
        </div>
      </div>

      <div className="request-toolbar">
        <div className="request-tabs">
          {(["Active", "Chats", "Completed"] as const).map((option) => (
            <button
              key={option}
              className={tab === option ? "active" : ""}
              onClick={() => setTab(option)}
            >
              {option}
              <span>
                {option === "Active"
                  ? activeDeals.length
                  : option === "Chats"
                    ? chats.length
                    : completedDeals.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {tab === "Active" && (
        <>
          <div className="return-note">
            <span className="activity-icon tone-1">
              <Icon name="clock" size={18} />
            </span>
            <div>
              <strong>Borrowed items return automatically</strong>
              <p>
                When a lending period expires, the deal status updates to Returned. Use Return early
                if you hand the item back before the due date.
              </p>
            </div>
          </div>
          <div className="deals-section-heading">
            <div>
              <h2>Active deals</h2>
              <p>Items requiring action or currently in progress</p>
            </div>
            <span>{activeDeals.length}</span>
          </div>
          <div className="deals-list">
            {activeDeals.length ? (
              activeDeals.map(dealCard)
            ) : (
              <div className="empty-state compact">
                <Icon name="bag" size={25} />
                <h3>No active deals</h3>
                <p>Your current offers, loans, and claims will appear here. Open conversations are in Chats.</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "Chats" && (
        <>
          <div className="deals-section-heading">
            <div>
              <h2>Chats</h2>
              <p>Conversations you started, including listings with no offer yet</p>
            </div>
            <span>{chats.length}</span>
          </div>
          <div className="deals-list">
            {chats.length ? (
              chats.map((thread) => (
                <article className="deal-card" key={thread.id}>
                  <button className="deal-image" onClick={() => onOpenListing(thread.listing)}>
                    <img src={thread.listing.image} alt={thread.listing.title} />
                    <span
                      className={`type-badge ${thread.listing.type.replace(" ", "-").toLowerCase()}`}
                    >
                      {thread.listing.type}
                    </span>
                  </button>
                  <div className="deal-main">
                    <div className="deal-title-row">
                      <div>
                        <span className="deal-kind">Chat · @{thread.counterparty}</span>
                        <h3>{thread.listing.title}</h3>
                      </div>
                      <span className="deal-status">Chat</span>
                    </div>
                    <p className="deal-detail">
                      {thread.lastMessage || "Conversation started"}
                    </p>
                    <div className="deal-meta">
                      <span>
                        <Icon name="clock" size={14} />
                        {thread.updated}
                      </span>
                      <span>
                        <Icon name="pin" size={14} />
                        {thread.listing.location}
                      </span>
                    </div>
                    <div className="deal-actions">
                      <button
                        className="deal-text-action"
                        onClick={() => onOpenListing(thread.listing)}
                      >
                        View listing
                      </button>
                      <button
                        className="deal-text-action"
                        onClick={() => onChatListing(thread.listing, thread.counterparty)}
                      >
                        <Icon name="message" size={15} /> Open chat
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state compact">
                <Icon name="message" size={25} />
                <h3>No chats yet</h3>
                <p>When you message a seller, the conversation will appear here.</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "Completed" && (
        <>
          <div className="deals-section-heading">
            <div>
              <h2>Recently completed</h2>
              <p>Your latest completed or returned deals</p>
            </div>
            <span>{completedDeals.length}</span>
          </div>
          <div className="deals-list">
            {completedDeals.length ? (
              completedDeals.map(dealCard)
            ) : (
              <div className="empty-state compact">
                <Icon name="check" size={25} />
                <h3>No completed deals</h3>
                <p>Finished purchases, loans, and claims will appear here.</p>
              </div>
            )}
          </div>
        </>
      )}

      {ratingDeal && (
        <RatingDialog
          deal={ratingDeal}
          onClose={() => setRatingDeal(null)}
          onSubmit={(rating, review) => {
            void api
              .completeDeal(ratingDeal.id, rating, review)
              .then(() => onRefresh())
              .then(() => {
                onAction(`Review submitted for @${ratingDeal.listing.seller}`);
                setRatingDeal(null);
              })
              .catch((err) =>
                onAction(err instanceof Error ? err.message : "Could not complete deal."),
              );
          }}
        />
      )}
    </section>
  );
}

function DealHistoryPage({
  deals,
  onOpenListing,
}: {
  deals: api.HistoryDeal[];
  onOpenListing: (listing: Listing) => void;
}) {
  const [query, setQuery] = useState("");
  const [seller, setSeller] = useState("All sellers");
  const [category, setCategory] = useState("All categories");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredHistory = useMemo(
    () =>
      deals.filter((deal) => {
        const matchesQuery =
          deal.listing.title.toLowerCase().includes(query.toLowerCase()) ||
          deal.listing.seller.toLowerCase().includes(query.toLowerCase());
        return (
          matchesQuery &&
          (seller === "All sellers" || deal.listing.seller === seller) &&
          (category === "All categories" || deal.listing.category === category) &&
          (!fromDate || deal.date >= fromDate) &&
          (!toDate || deal.date <= toDate)
        );
      }),
    [deals, query, seller, category, fromDate, toDate],
  );

  const clearFilters = () => {
    setQuery("");
    setSeller("All sellers");
    setCategory("All categories");
    setFromDate("");
    setToDate("");
  };

  return (
    <section>
      <div className="page-title">
        <p className="eyebrow">BUYER PORTAL</p>
        <h1>Deal history</h1>
        <p>Search and review every completed marketplace deal.</p>
      </div>

      <div className="history-filter-card">
        <label className="history-search">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search item or seller..."
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>All categories</option>
            <option>Electronics</option>
            <option>Books</option>
            <option>Sports</option>
          </select>
        </label>
        <label>
          Seller
          <select value={seller} onChange={(event) => setSeller(event.target.value)}>
            <option>All sellers</option>
            {[...new Set(deals.map((deal) => deal.listing.seller))].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>
        <label>
          To
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
      </div>

      <div className="history-results-head">
        <span>
          <strong>{filteredHistory.length}</strong> deals found
        </span>
        {(query ||
          seller !== "All sellers" ||
          category !== "All categories" ||
          fromDate ||
          toDate) && <button onClick={clearFilters}>Clear all filters</button>}
      </div>

      {filteredHistory.length ? (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Item title</th>
                <th>Seller</th>
                <th>Deal date</th>
                <th>Deal type</th>
                <th>Outcome</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((deal) => (
                <tr key={deal.id}>
                  <td>
                    <button className="history-item" onClick={() => onOpenListing(deal.listing)}>
                      <img src={deal.listing.image} alt="" />
                      <span>
                        <strong>{deal.listing.title}</strong>
                        <small>{deal.listing.category}</small>
                      </span>
                    </button>
                  </td>
                  <td>@{deal.listing.seller}</td>
                  <td>
                    {new Intl.DateTimeFormat("en-HK", { dateStyle: "medium" }).format(
                      new Date(`${deal.date}T12:00:00`),
                    )}
                  </td>
                  <td>
                    <span className={`history-type type-${deal.type.toLowerCase()}`}>
                      {deal.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`history-outcome ${deal.outcome.includes("declined") ? "declined" : ""}`}
                    >
                      {deal.outcome}
                    </span>
                  </td>
                  <td>
                    <button
                      className="history-open"
                      onClick={() => onOpenListing(deal.listing)}
                      aria-label={`Open ${deal.listing.title}`}
                    >
                      <Icon name="chevron" size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state history-empty">
          <Icon name="search" size={28} />
          <h3>No matching deals</h3>
          <p>Try changing your search, date range, category, or seller.</p>
          <button className="secondary-action" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}

type SellerRequest = {
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

function SellerRequestsPage({
  requests,
  onRequestsChange,
  buyerDealState,
  onBuyerDealsChange,
  onChatListing,
  onRecordFormalChat,
  onAction,
  onRefresh,
}: {
  requests: SellerRequest[];
  onRequestsChange: (requests: SellerRequest[]) => void;
  buyerDealState: BuyerDeal[];
  onBuyerDealsChange: (deals: BuyerDeal[]) => void;
  onChatListing: (listing: Listing, participant?: string) => void;
  onRecordFormalChat: (listing: Listing, buyer: string, body: string) => void;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const [filter, setFilter] = useState("Pending");
  const [countering, setCountering] = useState<SellerRequest | null>(null);
  const [confirming, setConfirming] = useState<{
    request: SellerRequest;
    action: "Accept" | "Decline";
  } | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterStart, setCounterStart] = useState("");
  const [counterEnd, setCounterEnd] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const visibleRequests =
    filter === "All" ? requests : requests.filter((request) => request.status === filter);

  const updateBuyerDeal = (
    request: SellerRequest,
    status: SellerRequest["status"],
    detail: string,
  ) => {
    onBuyerDealsChange(
      buyerDealState.map((deal) =>
        deal.id === request.dealId
          ? {
              ...deal,
              status:
                status === "Accepted"
                  ? request.type === "Offer"
                    ? "Accepted · Reserved"
                    : request.type === "Borrow"
                      ? "Accepted · Lent"
                      : "Accepted · Given"
                  : status,
              detail,
              completed: status === "Declined",
            }
          : deal,
      ),
    );
  };

  const confirmAction = () => {
    if (!confirming) return;
    const { request, action } = confirming;
    const acceptedStatus =
      request.type === "Offer" ? "Reserved" : request.type === "Borrow" ? "Lent" : "Given";
    const nextStatus = action === "Accept" ? "Accepted" : "Declined";
    void api
      .respondToOffer(request.id, action === "Accept" ? "accept" : "decline")
      .then(() => onRefresh())
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not update request."));
    onRequestsChange(
      requests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: nextStatus,
              listingStatus: action === "Accept" ? acceptedStatus : item.listingStatus,
            }
          : item,
      ),
    );
    updateBuyerDeal(
      request,
      nextStatus,
      action === "Accept"
        ? `${request.type} accepted by @${request.listing.seller} · Listing ${acceptedStatus}`
        : `${request.type} declined by @${request.listing.seller}`,
    );
    setNotice(
      action === "Accept"
        ? `Accepted. ${request.listing.title} is now ${acceptedStatus}. @${request.buyer} was notified.`
        : `Request declined. @${request.buyer} was notified.`,
    );
    onAction(`Buyer @${request.buyer} notified`);
    setConfirming(null);
  };

  const submitCounter = (event: React.FormEvent) => {
    event.preventDefault();
    if (!countering) return;
    setFormError("");
    let detail = "";
    if (countering.type === "Offer") {
      if (!Number(counterPrice) || Number(counterPrice) <= 0) {
        setFormError("Enter a valid counter price.");
        return;
      }
      detail = `Seller counter: HK$${Number(counterPrice).toLocaleString()}`;
    } else {
      if (!counterStart || !counterEnd || new Date(counterEnd) <= new Date(counterStart)) {
        setFormError("Choose a valid start and end period.");
        return;
      }
      detail = `Seller proposed new lending dates: ${counterStart.replace("T", " ")} → ${counterEnd.replace("T", " ")}`;
    }
    const chatBody =
      countering.type === "Offer"
        ? `Formal counter: HK$${Number(counterPrice).toLocaleString()}`
        : `Formal counter: ${counterStart.replace("T", " ")} → ${counterEnd.replace("T", " ")}`;
    void api
      .respondToOffer(countering.id, "counter", {
        price: countering.type === "Offer" ? Number(counterPrice) : undefined,
        start: counterStart,
        end: counterEnd,
      })
      .then(() => onRefresh())
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not send counter."));
    onRecordFormalChat(countering.listing, countering.buyer, chatBody);
    onRequestsChange(
      requests.map((request) =>
        request.id === countering.id ? { ...request, status: "Countered", detail } : request,
      ),
    );
    updateBuyerDeal(countering, "Countered", detail);
    setNotice(`Counter sent to @${countering.buyer}. They were notified in My Deals and chat.`);
    onAction(`Counter sent to @${countering.buyer}`);
    setCountering(null);
    setCounterPrice("");
    setCounterStart("");
    setCounterEnd("");
  };

  const pendingCount = requests.filter((request) => request.status === "Pending").length;

  return (
    <section>
      <div className="page-title request-page-title">
        <div>
          <p className="eyebrow">SELLER PORTAL</p>
          <h1>Offers & requests</h1>
          <p>Review and respond to incoming offers, borrow requests, and claims.</p>
        </div>
        <div className="request-summary">
          <strong>{pendingCount}</strong>
          <span>Awaiting your response</span>
        </div>
      </div>

      {notice && (
        <div className="seller-action-notice">
          <span>✓</span>
          <p>{notice}</p>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <Icon name="x" size={15} />
          </button>
        </div>
      )}

      <div className="request-toolbar">
        <div className="request-tabs">
          {["Pending", "Accepted", "Countered", "Declined", "All"].map((status) => (
            <button
              key={status}
              className={filter === status ? "active" : ""}
              onClick={() => setFilter(status)}
            >
              {status}
              {status === "Pending" && <span>{pendingCount}</span>}
            </button>
          ))}
        </div>
        <span>{visibleRequests.length} requests</span>
      </div>

      <div className="seller-request-list">
        {visibleRequests.length ? (
          visibleRequests.map((request) => (
            <article className="seller-request-card" key={request.id}>
              <div className="request-listing">
                <img src={request.listing.image} alt={request.listing.title} />
                <span
                  className={`type-badge ${request.listing.type.replace(" ", "-").toLowerCase()}`}
                >
                  {request.listing.type}
                </span>
              </div>
              <div className="request-card-main">
                <div className="request-card-head">
                  <div>
                    <span className="request-type-label">{request.type} REQUEST</span>
                    <h2>{request.listing.title}</h2>
                    <p>
                      from <strong>@{request.buyer}</strong> · {request.submitted}
                    </p>
                  </div>
                  <div className="request-badges">
                    <span className={`deal-status status-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                    <span className={`listing-state state-${request.listingStatus.toLowerCase()}`}>
                      Listing: {request.listingStatus}
                    </span>
                  </div>
                </div>

                <div className="request-detail-box">
                  <span>
                    {request.type === "Offer"
                      ? "PROPOSED PRICE"
                      : request.type === "Borrow"
                        ? "PROPOSED LENDING PERIOD"
                        : "CLAIM DETAILS"}
                  </span>
                  <strong>{request.detail}</strong>
                </div>

                {countering?.id === request.id && (
                  <form className="counter-form" onSubmit={submitCounter}>
                    <div className="counter-heading">
                      <div>
                        <strong>
                          Counter {request.type === "Offer" ? "price" : "lending period"}
                        </strong>
                        <small>The buyer will receive this as a formal counteroffer.</small>
                      </div>
                      <button type="button" onClick={() => setCountering(null)}>
                        <Icon name="x" size={16} />
                      </button>
                    </div>
                    {request.type === "Offer" ? (
                      <label>
                        Counter price
                        <div className="money-input">
                          <span>HK$</span>
                          <input
                            type="number"
                            min="1"
                            value={counterPrice}
                            onChange={(event) => setCounterPrice(event.target.value)}
                            placeholder="Enter amount"
                            autoFocus
                          />
                        </div>
                      </label>
                    ) : (
                      <div className="date-fields">
                        <label>
                          Start date & time
                          <input
                            type="datetime-local"
                            value={counterStart}
                            onChange={(event) => setCounterStart(event.target.value)}
                          />
                        </label>
                        <label>
                          End date & time
                          <input
                            type="datetime-local"
                            value={counterEnd}
                            onChange={(event) => setCounterEnd(event.target.value)}
                          />
                        </label>
                      </div>
                    )}
                    {formError && <p className="form-error">{formError}</p>}
                    <button className="primary-action counter-submit">Send counter</button>
                  </form>
                )}

                <div className="request-card-actions">
                  <button
                    className="deal-text-action"
                    onClick={() => onChatListing(request.listing, request.buyer)}
                  >
                    <Icon name="message" size={16} /> Open chat
                  </button>
                  <span />
                  {request.status === "Pending" && (
                    <>
                      <button
                        className="request-decline"
                        onClick={() => setConfirming({ request, action: "Decline" })}
                      >
                        Decline
                      </button>
                      {request.type !== "Claim" && (
                        <button
                          className="secondary-action"
                          onClick={() => {
                            setCountering(request);
                            setFormError("");
                          }}
                        >
                          Counter
                        </button>
                      )}
                      <button
                        className="primary-action"
                        onClick={() => setConfirming({ request, action: "Accept" })}
                      >
                        Accept
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <Icon name="inbox" size={28} />
            <h3>No {filter.toLowerCase()} requests</h3>
            <p>Requests with this status will appear here.</p>
          </div>
        )}
      </div>

      {confirming && (
        <div className="modal-backdrop" onMouseDown={() => setConfirming(null)}>
          <div
            className="confirm-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <span className={`confirm-icon ${confirming.action.toLowerCase()}`}>
              <Icon name={confirming.action === "Accept" ? "check" : "x"} size={23} />
            </span>
            <h2>
              {confirming.action} this {confirming.request.type.toLowerCase()}?
            </h2>
            <p>
              {confirming.action === "Accept"
                ? `The listing status will update and @${confirming.request.buyer} will be notified immediately.`
                : `The request will close and @${confirming.request.buyer} will be notified.`}
            </p>
            <div className="confirm-actions">
              <button className="secondary-action" onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button
                className={confirming.action === "Accept" ? "primary-action" : "destructive-action"}
                onClick={confirmAction}
              >
                {confirming.action} request
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type ListingFormType = "" | "Sell" | "Lend" | "Give Away";

type PhotoPreview = {
  id: string;
  name: string;
  url: string;
  file?: File;
};

function CreateListingForm({
  onAction,
  onRefresh,
  users,
  role,
}: {
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
  users: MarketplaceUser[];
  role: Role;
}) {
  const [listingType, setListingType] = useState<ListingFormType>("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const chooseType = (type: ListingFormType) => {
    setListingType(type);
    setFormError("");
    setSubmitted(false);
  };

  const startAnotherListing = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setPhotoError("");
    setFormError("");
    setListingType("");
    setSubmitted(false);
  };

  const addPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setPhotoError("");
    if (photos.length + files.length > 6) {
      setPhotoError(`You can upload up to 6 photos. ${6 - photos.length} slots remain.`);
      event.target.value = "";
      return;
    }
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      setPhotoError("Only image files can be uploaded.");
    }
    setPhotos((current) => [
      ...current,
      ...imageFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      })),
    ]);
    event.target.value = "";
  };

  const removePhoto = (photo: PhotoPreview) => {
    URL.revokeObjectURL(photo.url);
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    setPhotoError("");
  };

  const submitListing = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!listingType) {
      setFormError("Choose a listing type before completing the form.");
      return;
    }
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    void (async () => {
      try {
        const photoUrls = await api.uploadListingPhotos(photos);
        const durationValue = Number(formData.get("duration") || 0);
        await api.createListing({
          type: listingType as Listing["type"],
          title: String(formData.get("title") ?? ""),
          category: String(formData.get("category") ?? ""),
          condition: String(formData.get("condition") ?? ""),
          description: String(formData.get("description") ?? ""),
          location: String(formData.get("location") ?? ""),
          price: listingType === "Sell" ? Number(formData.get("price")) : undefined,
          duration: listingType === "Lend" ? durationValue : undefined,
          durationUnit: listingType === "Lend" ? (String(formData.get("durationUnit")) as "Hours" | "Days" | "Weeks") : undefined,
          photos: photoUrls,
          sellerId: role === "Admin" ? String(formData.get("sellerId") || "") || undefined : undefined,
          goLive: role === "Admin",
        });
        await onRefresh();
        setSubmitted(true);
        onAction(
          role === "Admin"
            ? "Listing added to the marketplace"
            : "Listing submitted with status Pending Review",
        );
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Could not submit listing.");
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <section>
      <div className="page-title">
        <p className="eyebrow">SELLER PORTAL</p>
        <h1>Create a new listing</h1>
        <p>Choose a listing type first, then add the details for your item.</p>
      </div>
      {submitted ? (
        <div className="form-card create-listing-card listing-submitted">
          <svg
            className="listing-submitted-mark"
            viewBox="0 0 96 96"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="48" cy="48" r="46" fill="currentColor" />
            <path
              d="M28 50.5 41.5 64 68 33"
              stroke="#fff"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2>Submitted</h2>
          <p>
            {role === "Admin"
              ? "Your listing is now live on the marketplace."
              : "Your listing is now pending review. You will be notified when an admin approves or rejects it."}
          </p>
          <button type="button" className="primary-action" onClick={startAnotherListing}>
            Create another listing
          </button>
        </div>
      ) : (
      <form className="form-card create-listing-card" onSubmit={submitListing} noValidate>
        <div className="form-section-heading">
          <span>1</span>
          <div>
            <h3>Choose a listing type</h3>
            <p>This determines the required details and buyer actions.</p>
          </div>
          <small>REQUIRED</small>
        </div>
        <div className="type-options dynamic-types">
          {[
            ["Sell", "Set a fixed price and receive offers"],
            ["Lend", "Choose how long the item can be borrowed"],
            ["Give Away", "Let another campus member claim it"],
          ].map(([type, description]) => (
            <label key={type} className={listingType === type ? "selected" : ""}>
              <input
                type="radio"
                name="listingType"
                value={type}
                checked={listingType === type}
                onChange={() => chooseType(type as ListingFormType)}
                required
              />
              <span>
                <strong>{type}</strong>
                <small>{description}</small>
              </span>
            </label>
          ))}
        </div>

        {!listingType ? (
          <div className="type-gate">
            <Icon name="check" size={23} />
            <strong>Start by choosing a listing type</strong>
            <p>The rest of the form will appear with the correct required fields.</p>
          </div>
        ) : (
          <>
            <div className="form-section-heading details-heading">
              <span>2</span>
              <div>
                <h3>Item details</h3>
                <p>Give buyers clear, accurate information about your item.</p>
              </div>
              <small>ALL FIELDS REQUIRED</small>
            </div>
            <div className="form-grid">
              {role === "Admin" && (
                <label>
                  Seller account
                  <select name="sellerId" required defaultValue="">
                    <option value="" disabled>
                      Select a seller
                    </option>
                    {users
                      .filter((user) => user.role === "Seller" && user.status !== "Deactivated")
                      .map((user) => (
                        <option value={user.id} key={user.username}>
                          @{user.username} · {user.fullName}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label>
                Listing title
                <input name="title" required placeholder="e.g. Casio scientific calculator" />
              </label>
              <label>
                Category
                <select name="category" required defaultValue="">
                  <option value="" disabled>
                    Select a category
                  </option>
                  <option>Electronics</option>
                  <option>Books & Course Materials</option>
                  <option>Furniture & Home</option>
                  <option>Fashion & Accessories</option>
                  <option>Sports & Outdoors</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Condition
                <select name="condition" required defaultValue="">
                  <option value="" disabled>
                    Select condition
                  </option>
                  <option>New</option>
                  <option>Like New</option>
                  <option>Used</option>
                  <option>For Parts</option>
                </select>
              </label>
              <label>
                Meet-up location
                <select name="location" required defaultValue="">
                  <option value="" disabled>
                    Select an HKUST location
                  </option>
                  <option>Academic Building Atrium</option>
                  <option>Library Entrance</option>
                  <option>Lee Shau Kee Business Building</option>
                  <option>North Gate</option>
                  <option>South Gate</option>
                  <option>Hall I Lobby</option>
                  <option>Hall IX Lobby</option>
                  <option>Seafront Cafeteria</option>
                </select>
              </label>
              <label className="wide">
                Description
                <textarea
                  name="description"
                  rows={5}
                  required
                  minLength={20}
                  placeholder="Describe the item, what is included, and anything the buyer or borrower should know..."
                />
                <small className="field-helper">Minimum 20 characters</small>
              </label>

              {listingType === "Sell" && (
                <label>
                  Price (HK$)
                  <div className="money-input form-money-input">
                    <span>HK$</span>
                    <input name="price" type="number" min="1" step="1" required placeholder="0" />
                  </div>
                  <small className="field-helper">Required for Sell listings</small>
                </label>
              )}

              {listingType === "Lend" && (
                <label>
                  Lending duration
                  <div className="duration-input">
                    <input name="duration" type="number" min="1" required placeholder="e.g. 7" />
                    <select name="durationUnit" aria-label="Lending duration unit">
                      <option>Hours</option>
                      <option>Days</option>
                      <option>Weeks</option>
                    </select>
                  </div>
                  <small className="field-helper">Maximum period offered per request</small>
                </label>
              )}
            </div>

            <div className="form-section-heading photo-heading">
              <span>3</span>
              <div>
                <h3>Photos</h3>
                <p>Add up to 6 photos. They are resized in the browser (~1200px) before upload.</p>
              </div>
              <small>{photos.length} / 6 ADDED</small>
            </div>
            <div className="photo-upload-grid">
              {photos.map((photo, index) => (
                <div className="photo-preview" key={photo.id}>
                  <img src={photo.url} alt={`Upload preview ${index + 1}: ${photo.name}`} />
                  {index === 0 && <span>Cover</span>}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo)}
                    aria-label={`Remove ${photo.name}`}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <label className="photo-upload">
                  <Icon name="plus" size={22} />
                  <strong>Add photos</strong>
                  <small>JPG, PNG or WEBP</small>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={addPhotos}
                  />
                </label>
              )}
              {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, index) => (
                <div className="photo-slot" key={index}>
                  <span>{photos.length + index + 2}</span>
                </div>
              ))}
            </div>
            {photoError && <p className="form-error photo-error">{photoError}</p>}
          </>
        )}

        {formError && <p className="form-error listing-form-error">{formError}</p>}
        <div className="create-form-footer">
          <div>
            <strong>Submission status</strong>
            <span>New listings are reviewed before going live.</span>
          </div>
          <button
            className="primary-action form-submit"
            disabled={!listingType || busy}
            type="submit"
          >
            {busy ? "Uploading photos…" : "Submit for review"}
          </button>
        </div>
      </form>
      )}
    </section>
  );
}

type NotificationItem = {
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

function listingFromNotification(message: string, listings: Listing[]) {
  const quoted = [...message.matchAll(/[“"]([^”"]+)[”"]/g)].map((match) => match[1].trim());
  for (const title of quoted) {
    const hit = listings.find((listing) => listing.title === title);
    if (hit) return hit;
  }
  return listings.find((listing) => message.includes(listing.title));
}

function usernameFromNotification(item: NotificationItem) {
  return `${item.title} ${item.message}`.match(/@([A-Za-z0-9._-]+)/)?.[1];
}

function chatTargetFromNotification(
  item: NotificationItem,
  role: Role,
  listings: Listing[],
  sellerRequests: SellerRequest[],
  buyerDeals: BuyerDeal[],
) {
  const username = usernameFromNotification(item);
  const listing = listingFromNotification(`${item.title} ${item.message}`, listings);

  if (role === "Seller") {
    const request =
      sellerRequests.find(
        (entry) =>
          Boolean(username) &&
          entry.buyer === username &&
          (!listing || entry.listing.id === listing.id),
      ) ??
      sellerRequests.find((entry) => Boolean(username) && entry.buyer === username) ??
      sellerRequests.find((entry) => listing != null && entry.listing.id === listing.id);
    if (request) return { listing: request.listing, participant: request.buyer };
  }

  if (role === "Buyer") {
    const deal =
      buyerDeals.find((entry) => listing != null && entry.listing.id === listing.id) ??
      buyerDeals.find((entry) => Boolean(username) && entry.listing.seller === username);
    if (deal) return { listing: deal.listing };
    if (listing) return { listing };
    if (username) {
      const bySeller = listings.find((entry) => entry.seller === username);
      if (bySeller) return { listing: bySeller };
    }
  }

  if (listing) return { listing, participant: username };
  return null;
}

function pageForNotificationAction(action: string, role: Role) {
  if (action === "Review listing") return role === "Admin" ? "Listing Review" : "My Listings";
  if (action === "View listing") {
    return role === "Admin" ? "All Listings" : role === "Seller" ? "My Listings" : "Browse";
  }
  if (action === "View offer" || action === "Review request") {
    return role === "Seller" ? "Offers / Requests" : role === "Admin" ? "All Deals" : "My Deals";
  }
  if (action === "View deal" || action === "View deals") {
    return role === "Admin" ? "All Deals" : "My Deals";
  }
  if (action === "View rating" || action === "View reviews") {
    return role === "Admin" ? "Ratings Overview" : role === "Seller" ? "Reviews" : "Rate Sellers";
  }
  if (action === "View users") return "All Users";
  return null;
}

function NotificationBoard({
  role,
  items,
  listings,
  sellerRequests,
  buyerDeals,
  readIds,
  onReadIdsChange,
  onOpenListing,
  onChatListing,
  onNavigate,
}: {
  role: Role;
  items: NotificationItem[];
  listings: Listing[];
  sellerRequests: SellerRequest[];
  buyerDeals: BuyerDeal[];
  readIds: number[];
  onReadIdsChange: (ids: number[]) => void;
  onOpenListing: (listing: Listing) => void;
  onChatListing: (listing: Listing, participant?: string) => void;
  onNavigate: (page: string) => void;
}) {
  const [filter, setFilter] = useState("All");
  const notifications = items;
  const unreadCount = notifications.filter((item) => !readIds.includes(item.id)).length;
  const categories = [...new Set(notifications.map((item) => item.category))];
  const visibleNotifications = notifications.filter((item) => {
    if (filter === "Unread") return !readIds.includes(item.id);
    if (filter === "All") return true;
    return item.category === filter;
  });

  const markRead = (id: number) => {
    if (readIds.includes(id)) return;
    const next = [...readIds, id];
    onReadIdsChange(next);
    void api.markNotificationsRead([id]);
  };

  return (
    <section>
      <div className="page-title notification-page-title">
        <div>
          <p className="eyebrow">{role.toUpperCase()} PORTAL</p>
          <h1>Notifications</h1>
          <p>Important updates about your marketplace activity.</p>
        </div>
        <div className="notification-summary">
          <strong>{unreadCount}</strong>
          <span>Unread notifications</span>
        </div>
      </div>

      <div className="notification-toolbar">
        <div className="notification-filters">
          {["All", "Unread"].map((option) => (
            <button
              key={option}
              className={filter === option ? "active" : ""}
              onClick={() => setFilter(option)}
            >
              {option}
              {option === "Unread" && unreadCount > 0 && <span>{unreadCount}</span>}
            </button>
          ))}
          <select
            value={categories.includes(filter) ? filter : ""}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="" disabled>
              Category
            </option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <button
          className="mark-all-read"
          disabled={!unreadCount}
          onClick={() => {
            const ids = notifications.map((item) => item.id);
            onReadIdsChange(ids);
            void api.markNotificationsRead(ids);
          }}
        >
          <Icon name="check" size={15} />
          Mark all as read
        </button>
      </div>

      {visibleNotifications.length ? (
        <div className="notification-groups">
          {(["Today", "Earlier"] as const).map((group) => {
            const groupItems = visibleNotifications.filter((item) => item.dateGroup === group);
            if (!groupItems.length) return null;
            return (
              <div className="notification-group" key={group}>
                <div className="notification-group-heading">
                  <span>{group}</span>
                  <i />
                </div>
                <div className="notification-list">
                  {groupItems.map((item) => {
                    const unread = !readIds.includes(item.id);
                    return (
                      <article
                        className={`notification-card ${unread ? "unread" : ""}`}
                        key={item.id}
                        onClick={() => markRead(item.id)}
                      >
                        <span className={`notification-icon tone-${item.tone}`}>
                          <Icon name={item.icon} size={19} />
                        </span>
                        <div className="notification-copy">
                          <div>
                            <span className={`notification-category category-${item.tone}`}>
                              {item.category}
                            </span>
                            <time>{item.timestamp}</time>
                          </div>
                          <h2>{item.title}</h2>
                          <p>{item.message}</p>
                        </div>
                        <div className="notification-side">
                          {unread && <span className="unread-dot" aria-label="Unread" />}
                          {item.action && (
                            <button
                              type="button"
                              className="notification-action"
                              onClick={(event) => {
                                event.stopPropagation();
                                markRead(item.id);
                                if (item.action === "Open chat") {
                                  const target = chatTargetFromNotification(
                                    item,
                                    role,
                                    listings,
                                    sellerRequests,
                                    buyerDeals,
                                  );
                                  if (target) {
                                    onChatListing(target.listing, target.participant);
                                    return;
                                  }
                                  const username = usernameFromNotification(item);
                                  if (!username) return;
                                  void api
                                    .findChatWithUsername(username)
                                    .then((found) => {
                                      if (!found) return;
                                      onChatListing(found.listing, found.participant);
                                    })
                                    .catch(() => undefined);
                                  return;
                                }
                                const listing = listingFromNotification(
                                  `${item.title} ${item.message}`,
                                  listings,
                                );
                                const nextPage = pageForNotificationAction(item.action!, role);
                                if (nextPage) onNavigate(nextPage);
                                if (listing) onOpenListing(listing);
                              }}
                            >
                              {item.action}
                              <Icon name="chevron" size={16} />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state notification-empty">
          <Icon name="bell" size={27} />
          <h3>No notifications here</h3>
          <p>
            {filter === "Unread"
              ? "You are all caught up. New unread notifications will appear here."
              : "Try choosing a different category."}
          </p>
          <button className="secondary-action" onClick={() => setFilter("All")}>
            View all notifications
          </button>
        </div>
      )}
    </section>
  );
}

type ReviewListing = {
  id: number;
  listing: Listing;
  sellerFullName: string;
  submitted: string;
  status: "Pending Review" | "Approved" | "Rejected";
  rejectionReason?: string;
};

function ListingReviewPage({
  records,
  onRecordsChange,
  onAction,
  onRefresh,
  onOpenListing,
}: {
  records: ReviewListing[];
  onRecordsChange: (records: ReviewListing[]) => void;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
  onOpenListing: (listing: Listing) => void;
}) {
  const [filter, setFilter] = useState<"Pending Review" | "Approved" | "Rejected" | "All">(
    "Pending Review",
  );
  const [approving, setApproving] = useState<ReviewListing | null>(null);
  const [rejecting, setRejecting] = useState<ReviewListing | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const visibleRecords =
    filter === "All" ? records : records.filter((record) => record.status === filter);
  const pendingCount = records.filter((record) => record.status === "Pending Review").length;

  const approve = () => {
    if (!approving) return;
    void api
      .moderateListing(approving.listing.id, "approve")
      .then(() => onRefresh())
      .then(() => {
        onAction(`Listing approved. @${approving.listing.seller} was notified.`);
        setApproving(null);
      })
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not approve listing."));
  };

  const reject = (event: React.FormEvent) => {
    event.preventDefault();
    if (!rejecting) return;
    if (reason.trim().length < 10) {
      setReasonError("Provide a clear reason of at least 10 characters.");
      return;
    }
    void api
      .moderateListing(rejecting.listing.id, "reject", reason.trim())
      .then(() => onRefresh())
      .then(() => {
        onAction(`Listing rejected. Reason sent to @${rejecting.listing.seller}.`);
        setRejecting(null);
        setReason("");
        setReasonError("");
      })
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not reject listing."));
  };

  return (
    <section>
      <div className="page-title admin-page-title">
        <div>
          <p className="eyebrow">ADMIN PORTAL</p>
          <h1>Listing review</h1>
          <p>Click a card to inspect photos. Approve or reject from the queue.</p>
        </div>
        <div className="admin-queue-count">
          <strong>{pendingCount}</strong>
          <span>Pending review</span>
        </div>
      </div>

      <div className="admin-tabs">
        {(["Pending Review", "Approved", "Rejected", "All"] as const).map((status) => (
          <button
            key={status}
            className={filter === status ? "active" : ""}
            onClick={() => setFilter(status)}
          >
            {status}
            <span>
              {status === "All"
                ? records.length
                : records.filter((record) => record.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {visibleRecords.length ? (
        <div className="review-list">
          {visibleRecords.map((record) => {
            const photoCount = record.listing.images?.length ?? (record.listing.image ? 1 : 0);
            return (
              <article
                className="review-card"
                key={record.id}
                onClick={() => onOpenListing(record.listing)}
              >
                <div className="review-photos">
                  <ListingPhoto src={record.listing.image} alt={record.listing.title} />
                  {photoCount > 1 && <span>{photoCount} photos</span>}
                </div>
                <div className="review-card-body">
                  <div className="review-title-row">
                    <div>
                      <span className="review-id">
                        SUBMISSION #{String(record.id).padStart(4, "0")}
                      </span>
                      <h2>{record.listing.title}</h2>
                    </div>
                    <span
                      className={`deal-status status-${record.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <dl className="review-facts">
                    <div>
                      <dt>Category</dt>
                      <dd>{record.listing.category}</dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>{record.listing.type}</dd>
                    </div>
                    <div>
                      <dt>Meet-up</dt>
                      <dd>{record.listing.location}</dd>
                    </div>
                  </dl>
                  {record.rejectionReason && (
                    <div className="rejection-note">
                      <strong>Rejection reason</strong>
                      <p>{record.rejectionReason}</p>
                    </div>
                  )}
                  <div className="review-footer">
                    <dl className="review-meta">
                      <div>
                        <dt>Seller</dt>
                        <dd>
                          @{record.listing.seller}
                          <small>{record.sellerFullName}</small>
                        </dd>
                      </div>
                      <div>
                        <dt>Submitted</dt>
                        <dd>{record.submitted}</dd>
                      </div>
                    </dl>
                    {record.status === "Pending Review" && (
                      <div className="review-actions">
                        <button
                          className="request-decline"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRejecting(record);
                            setReason("");
                            setReasonError("");
                          }}
                        >
                          Reject
                        </button>
                        <button
                          className="primary-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            setApproving(record);
                          }}
                        >
                          <Icon name="check" size={15} />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="check" size={28} />
          <h3>No {filter.toLowerCase()} listings</h3>
          <p>Listings with this review status will appear here.</p>
        </div>
      )}

      {approving && (
        <div className="modal-backdrop" onMouseDown={() => setApproving(null)}>
          <div
            className="confirm-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <span className="confirm-icon">
              <Icon name="check" size={23} />
            </span>
            <h2>Approve this listing?</h2>
            <p>
              “{approving.listing.title}” will become Available and @{approving.listing.seller} will
              be notified.
            </p>
            <div className="confirm-actions">
              <button className="secondary-action" onClick={() => setApproving(null)}>
                Cancel
              </button>
              <button className="primary-action" onClick={approve}>
                Approve listing
              </button>
            </div>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="modal-backdrop" onMouseDown={() => setRejecting(null)}>
          <form
            className="admin-reject-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={reject}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setRejecting(null)}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
            <p className="eyebrow">REJECT SUBMISSION</p>
            <h2>Provide a rejection reason</h2>
            <p>
              Explain what @{rejecting.listing.seller} must change before resubmitting “
              {rejecting.listing.title}”.
            </p>
            <label>
              Written reason <span>Required</span>
              <textarea
                rows={5}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError("");
                }}
                placeholder="Be specific and actionable..."
                autoFocus
              />
              <small>{reason.length} characters · minimum 10</small>
            </label>
            {reasonError && <p className="form-error">{reasonError}</p>}
            <div className="confirm-actions">
              <button type="button" className="secondary-action" onClick={() => setRejecting(null)}>
                Cancel
              </button>
              <button className="destructive-action">Reject and notify seller</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function ManageUsersPage({
  users,
  onUsersChange,
  onAction,
  onRefresh,
}: {
  users: MarketplaceUser[];
  onUsersChange: (users: MarketplaceUser[]) => void;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [editing, setEditing] = useState<MarketplaceUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editResidence, setEditResidence] = useState("");
  const [confirming, setConfirming] = useState<{
    user: MarketplaceUser;
    action: "deactivate" | "reactivate" | "delete";
  } | null>(null);

  const visibleUsers = users.filter((user) => {
    const status = user.status ?? "Active";
    return (
      (user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.fullName.toLowerCase().includes(query.toLowerCase())) &&
      (roleFilter === "All roles" || user.role === roleFilter) &&
      (statusFilter === "All statuses" || status === statusFilter)
    );
  });

  const openUser = (user: MarketplaceUser) => {
    setEditing(user);
    setEditName(user.fullName);
    setEditResidence(user.residence ?? "");
  };

  const saveUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !editName.trim()) return;
    if (!editing.id) return;
    void api
      .adminUpdateUser(editing.id, { fullName: editName.trim(), residence: editResidence })
      .then(() => onRefresh())
      .then(() => {
        onAction(`@${editing.username} updated`);
        setEditing(null);
      })
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not update user."));
  };

  const confirmUserAction = () => {
    if (!confirming) return;
    const { user, action } = confirming;
    if (!user.id) return;
    const run =
      action === "delete"
        ? api.adminDeleteUser(user.id)
        : api.adminSetUserStatus(user.id, action === "deactivate" ? "deactivated" : "active");
    void run
      .then(() => onRefresh())
      .then(() => {
        onAction(
          action === "delete"
            ? `@${user.username} permanently deleted`
            : `@${user.username} ${action === "deactivate" ? "deactivated" : "reactivated"}`,
        );
        setConfirming(null);
      })
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not update user."));
  };

  return (
    <section>
      <div className="page-title admin-page-title">
        <div>
          <p className="eyebrow">ADMIN PORTAL</p>
          <h1>All users</h1>
          <p>View and manage registered Buyer and Seller accounts.</p>
        </div>
        <div className="admin-user-stats">
          <span>
            <strong>{users.length}</strong>Total
          </span>
          <span>
            <strong>{users.filter((user) => (user.status ?? "Active") === "Active").length}</strong>
            Active
          </span>
          <span>
            <strong>{users.filter((user) => user.status === "Deactivated").length}</strong>
            Deactivated
          </span>
        </div>
      </div>

      <div className="admin-data-note">
        <Icon name="inbox" size={18} />
        <p>
          <strong>Permanent deletion policy:</strong> active listings are taken down, open deals are
          retained as archived audit records, and chat messages remain available to participants and
          moderators under a “Deleted user” label.
        </p>
      </div>

      <div className="admin-user-toolbar">
        <label>
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search username or full name..."
          />
        </label>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option>All roles</option>
          <option>Buyer</option>
          <option>Seller</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All statuses</option>
          <option>Active</option>
          <option>Deactivated</option>
        </select>
      </div>

      {visibleUsers.length ? (
        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Residence</th>
                <th>Status</th>
                <th>Account data</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => {
                const status = user.status ?? "Active";
                return (
                  <tr key={user.username}>
                    <td>
                      <button className="admin-user-identity" onClick={() => openUser(user)}>
                        <span className="avatar">
                          {user.fullName
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <span>
                          <strong>{user.fullName}</strong>
                          <small>@{user.username}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className={`admin-role role-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.residence || "Not provided"}</td>
                    <td>
                      <span className={`user-status ${status.toLowerCase()}`}>
                        <i />
                        {status}
                      </span>
                    </td>
                    <td>
                      <span className="user-data-count">
                        {user.role === "Seller" ? "8 listings · 12 deals" : "6 deals · 4 chats"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button onClick={() => openUser(user)}>View / Edit</button>
                        <button
                          onClick={() =>
                            setConfirming({
                              user,
                              action: status === "Active" ? "deactivate" : "reactivate",
                            })
                          }
                        >
                          {status === "Active" ? "Deactivate" : "Reactivate"}
                        </button>
                        <button
                          className="delete"
                          onClick={() => setConfirming({ user, action: "delete" })}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="users" size={28} />
          <h3>No users found</h3>
          <p>Try changing your search or account filters.</p>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onMouseDown={() => setEditing(null)}>
          <form
            className="admin-user-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={saveUser}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditing(null)}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
            <p className="eyebrow">USER DETAILS</p>
            <h2>@{editing.username}</h2>
            <div className="user-dialog-meta">
              <span className={`admin-role role-${editing.role.toLowerCase()}`}>
                {editing.role}
              </span>
              <span className={`user-status ${(editing.status ?? "Active").toLowerCase()}`}>
                <i />
                {editing.status ?? "Active"}
              </span>
            </div>
            <div className="admin-edit-grid">
              <label>
                Full name
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                />
              </label>
              <label>
                Username
                <input value={editing.username} disabled readOnly />
              </label>
              <label className="wide">
                Residence
                <select
                  value={editResidence}
                  onChange={(event) => setEditResidence(event.target.value)}
                >
                  <option value="">Not provided</option>
                  <option>Hall I</option>
                  <option>Hall IX</option>
                  <option>Jockey Club Hall</option>
                  <option>Off-campus</option>
                </select>
              </label>
              {editing.role === "Seller" && (
                <label className="wide">
                  Seller bio
                  <textarea value={editing.bio ?? ""} disabled rows={3} />
                </label>
              )}
            </div>
            <div className="confirm-actions">
              <button type="button" className="secondary-action" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="primary-action">Save changes</button>
            </div>
          </form>
        </div>
      )}

      {confirming && (
        <div className="modal-backdrop" onMouseDown={() => setConfirming(null)}>
          <div
            className="admin-delete-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <span className={`confirm-icon ${confirming.action === "delete" ? "decline" : ""}`}>
              <Icon name={confirming.action === "reactivate" ? "check" : "user"} size={22} />
            </span>
            <h2>
              {confirming.action === "delete"
                ? "Permanently delete this user?"
                : `${confirming.action === "deactivate" ? "Deactivate" : "Reactivate"} @${confirming.user.username}?`}
            </h2>
            {confirming.action === "delete" ? (
              <div className="delete-impact">
                <p>This action cannot be undone.</p>
                <ul>
                  <li>Profile and credentials are permanently removed.</li>
                  <li>Active listings are taken down and affected users are notified.</li>
                  <li>Deals remain as archived audit records.</li>
                  <li>Chats are retained with a “Deleted user” label for safety.</li>
                </ul>
              </div>
            ) : (
              <p className="confirm-description">
                {confirming.action === "deactivate"
                  ? "The user will be unable to sign in. Their records stay intact until reactivated or deleted."
                  : "The user will regain access to their account and role dashboard."}
              </p>
            )}
            <div className="confirm-actions">
              <button className="secondary-action" onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button
                className={confirming.action === "delete" ? "destructive-action" : "primary-action"}
                onClick={confirmUserAction}
              >
                {confirming.action === "delete"
                  ? "Delete permanently"
                  : confirming.action === "deactivate"
                    ? "Deactivate account"
                    : "Reactivate account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type SellerListingStatus = "Pending" | "Live" | "Rejected" | "Reserved" | "Sold" | "Lent" | "Given";

type SellerListingRecord = {
  id: number;
  listing: Listing;
  status: SellerListingStatus;
  activeOffers: number;
  updated: string;
  rejectionReason?: string;
};

function SellerListingsPage({
  records,
  onRecordsChange,
  onOpenListing,
  onAction,
  onRefresh,
}: {
  records: SellerListingRecord[];
  onRecordsChange: (records: SellerListingRecord[]) => void;
  onOpenListing: (listing: Listing) => void;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const [filter, setFilter] = useState<"All" | SellerListingStatus>("All");
  const [editing, setEditing] = useState<SellerListingRecord | null>(null);
  const [confirming, setConfirming] = useState<{
    record: SellerListingRecord;
    action: "edit" | "delete";
    impacted: boolean;
  } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPhotos, setEditPhotos] = useState<PhotoPreview[]>([]);
  const [editPhotoError, setEditPhotoError] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const visibleRecords =
    filter === "All" ? records : records.filter((record) => record.status === filter);
  const finalStatuses: SellerListingStatus[] = ["Reserved", "Sold", "Lent", "Given"];

  const openEdit = (record: SellerListingRecord) => {
    setEditing(record);
    setEditTitle(record.listing.title);
    setEditCategory(record.listing.category);
    setEditCondition(record.listing.condition);
    setEditLocation(record.listing.location);
    setEditDescription(record.listing.description);
    setEditPhotoError("");
    setEditPhotos(
      (record.listing.images?.length ? record.listing.images : [record.listing.image])
        .filter((url) => url && !url.startsWith("data:image/svg"))
        .map((url, index) => ({
          id: `existing-${record.listing.id}-${index}`,
          name: `Photo ${index + 1}`,
          url,
        })),
    );
  };

  const requestEdit = (record: SellerListingRecord) => {
    if (record.activeOffers > 0) {
      setConfirming({ record, action: "edit", impacted: true });
      return;
    }
    openEdit(record);
  };

  const requestDelete = (record: SellerListingRecord) => {
    setConfirming({
      record,
      action: "delete",
      impacted: record.activeOffers > 0 || finalStatuses.includes(record.status),
    });
  };

  const confirmAction = () => {
    if (!confirming) return;
    const { record, action, impacted } = confirming;
    if (action === "delete") {
      void api
        .sellerRemoveListing(record.listing.id)
        .then(() => onRefresh())
        .then(() =>
          onAction(
            impacted
              ? `${record.listing.title} deleted. Affected buyers were notified.`
              : `${record.listing.title} deleted`,
          ),
        )
        .catch((err) => onAction(err instanceof Error ? err.message : "Could not delete listing."));
    } else {
      openEdit(record);
      onAction(`Affected buyers for ${record.listing.title} will be notified of saved changes`);
    }
    setConfirming(null);
  };

  const addEditPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setEditPhotoError("");
    if (editPhotos.length + files.length > 6) {
      setEditPhotoError(`You can upload up to 6 photos. ${6 - editPhotos.length} slots remain.`);
      event.target.value = "";
      return;
    }
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      setEditPhotoError("Only image files can be uploaded.");
    }
    setEditPhotos((current) => [
      ...current,
      ...imageFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      })),
    ]);
    event.target.value = "";
  };

  const removeEditPhoto = (photo: PhotoPreview) => {
    if (photo.file) URL.revokeObjectURL(photo.url);
    setEditPhotos((current) => current.filter((item) => item.id !== photo.id));
    setEditPhotoError("");
  };

  const saveEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || editBusy) return;
    setEditBusy(true);
    void (async () => {
      try {
        const photoUrls = await api.uploadListingPhotos(editPhotos);
        await api.updateListingDetails(editing.listing.id, {
          title: editTitle.trim(),
          category: editCategory,
          condition: editCondition,
          location: editLocation,
          description: editDescription.trim(),
          photos: photoUrls,
          resubmit: editing.status === "Rejected",
        });
        await onRefresh();
        onAction(
          editing.status === "Rejected"
            ? `${editTitle} resubmitted with status Pending`
            : `${editTitle} updated`,
        );
        setEditing(null);
      } catch (err) {
        onAction(err instanceof Error ? err.message : "Could not update listing.");
      } finally {
        setEditBusy(false);
      }
    })();
  };

  const statusOptions: Array<"All" | SellerListingStatus> = [
    "All",
    "Pending",
    "Live",
    "Rejected",
    "Reserved",
    "Sold",
    "Lent",
    "Given",
  ];

  return (
    <section>
      <div className="page-title seller-listings-title">
        <div>
          <p className="eyebrow">SELLER PORTAL</p>
          <h1>My listings</h1>
          <p>Manage every listing you have posted to the HKUST community.</p>
        </div>
        <div className="seller-listing-summary">
          <span>
            <strong>{records.length}</strong>Total
          </span>
          <span>
            <strong>{records.filter((record) => record.status === "Live").length}</strong>Live
          </span>
          <span>
            <strong>{records.reduce((total, record) => total + record.activeOffers, 0)}</strong>
            Active offers
          </span>
        </div>
      </div>

      <div className="seller-listing-policy">
        <Icon name="inbox" size={18} />
        <p>
          Listings with active offers or Reserved status require buyer notification before changes.
          Sold, Lent, and Given listings are locked for editing but may be deleted with a strong
          confirmation.
        </p>
      </div>

      <div className="seller-listing-filters">
        {statusOptions.map((status) => (
          <button
            key={status}
            className={filter === status ? "active" : ""}
            onClick={() => setFilter(status)}
          >
            {status}
            <span>
              {status === "All"
                ? records.length
                : records.filter((record) => record.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {visibleRecords.length ? (
        <div className="seller-listing-grid">
          {visibleRecords.map((record) => {
            const editLocked = finalStatuses.includes(record.status);
            return (
              <article className="seller-listing-card" key={record.id}>
                <button
                  className="seller-listing-image"
                  onClick={() => onOpenListing(record.listing)}
                  aria-label={`Open ${record.listing.title}`}
                >
                  <img src={record.listing.image} alt={record.listing.title} />
                  <span
                    className={`type-badge ${record.listing.type.replace(" ", "-").toLowerCase()}`}
                  >
                    {record.listing.type}
                  </span>
                  <span className={`seller-status status-${record.status.toLowerCase()}`}>
                    {record.status}
                  </span>
                </button>
                <div className="seller-listing-body">
                  <button
                    className="seller-listing-copy"
                    onClick={() => onOpenListing(record.listing)}
                  >
                    <span>{record.listing.category}</span>
                    <h2>{record.listing.title}</h2>
                    <p>
                      {record.listing.type} · {record.listing.condition}
                    </p>
                  </button>
                  <div className="seller-listing-meta">
                    <span>
                      <Icon name="pin" size={13} />
                      {record.listing.location}
                    </span>
                    <span>{record.updated}</span>
                  </div>
                  {record.activeOffers > 0 && (
                    <div className="active-offer-warning">
                      <Icon name="inbox" size={14} />
                      {record.activeOffers} active {record.activeOffers === 1 ? "offer" : "offers"}
                    </div>
                  )}
                  {record.rejectionReason && (
                    <div className="listing-rejection-reason">
                      <strong>Rejected:</strong> {record.rejectionReason}
                    </div>
                  )}
                  <div className="seller-listing-actions">
                    <button
                      className="listing-edit"
                      disabled={editLocked}
                      onClick={() => requestEdit(record)}
                      title={
                        editLocked
                          ? `${record.status} listings are locked for editing`
                          : "Edit listing"
                      }
                    >
                      {record.status === "Rejected" ? "Edit & resubmit" : "Edit"}
                    </button>
                    <button className="listing-delete" onClick={() => requestDelete(record)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state seller-listing-empty">
          <Icon name="grid" size={29} />
          <h3>{records.length ? `No ${filter.toLowerCase()} listings` : "No listings yet"}</h3>
          <p>
            {records.length
              ? "Listings with this status will appear here."
              : "Create your first listing to start selling, lending, or giving items away."}
          </p>
          {records.length > 0 && (
            <button className="secondary-action" onClick={() => setFilter("All")}>
              View all listings
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onMouseDown={() => setEditing(null)}>
          <form
            className="listing-edit-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={saveEdit}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditing(null)}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
            <p className="eyebrow">
              {editing.status === "Rejected" ? "EDIT & RESUBMIT" : "EDIT LISTING"}
            </p>
            <h2>{editing.listing.title}</h2>
            <p className="edit-dialog-note">
              Listing type cannot be changed after submission.
              {editing.activeOffers > 0 && " Buyers with active offers will be notified."}
            </p>
            <div className="admin-edit-grid">
              <label className="wide">
                Title
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  required
                />
              </label>
              <label>
                Category
                <select
                  value={editCategory}
                  onChange={(event) => setEditCategory(event.target.value)}
                >
                  <option>Electronics</option>
                  <option>Books</option>
                  <option>Sports</option>
                  <option>Furniture</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Condition
                <select
                  value={editCondition}
                  onChange={(event) => setEditCondition(event.target.value)}
                >
                  <option>New</option>
                  <option>Like new</option>
                  <option>Good</option>
                  <option>Used</option>
                  <option>Fair</option>
                  <option>For Parts</option>
                </select>
              </label>
              <label className="wide">
                Meet-up location
                <select
                  value={editLocation}
                  onChange={(event) => setEditLocation(event.target.value)}
                >
                  <option>Atrium</option>
                  <option>Library</option>
                  <option>North Gate</option>
                  <option>Hall IX</option>
                  <option>LSK Building</option>
                </select>
              </label>
              <label className="wide">
                Description
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  required
                />
              </label>
              <div className="wide">
                <small className="edit-photos-label">Photos · first is cover · existing Unsplash URLs stay until you replace them</small>
                <div className="photo-upload-grid edit-photo-grid">
                  {editPhotos.map((photo, index) => (
                    <div className="photo-preview" key={photo.id}>
                      <img src={photo.url} alt={`${photo.name}`} />
                      {index === 0 && <span>Cover</span>}
                      <button
                        type="button"
                        onClick={() => removeEditPhoto(photo)}
                        aria-label={`Remove ${photo.name}`}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  ))}
                  {editPhotos.length < 6 && (
                    <label className="photo-upload">
                      <Icon name="plus" size={22} />
                      <strong>Add photos</strong>
                      <small>JPG, PNG or WEBP</small>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={addEditPhotos}
                      />
                    </label>
                  )}
                </div>
                {editPhotoError && <p className="form-error photo-error">{editPhotoError}</p>}
              </div>
            </div>
            <div className="confirm-actions">
              <button type="button" className="secondary-action" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="primary-action" disabled={editBusy}>
                {editBusy
                  ? "Uploading photos…"
                  : editing.status === "Rejected"
                    ? "Save & resubmit"
                    : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirming && (
        <div className="modal-backdrop" onMouseDown={() => setConfirming(null)}>
          <div
            className="listing-impact-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <span className={`confirm-icon ${confirming.action === "delete" ? "decline" : ""}`}>
              <Icon name={confirming.action === "delete" ? "x" : "inbox"} size={22} />
            </span>
            <h2>
              {confirming.action === "delete"
                ? `Delete “${confirming.record.listing.title}”?`
                : "Edit a listing with active offers?"}
            </h2>
            {confirming.impacted ? (
              <div className="listing-impact-note">
                <strong>This listing has buyer or deal activity.</strong>
                <ul>
                  {confirming.record.activeOffers > 0 && (
                    <li>{confirming.record.activeOffers} active offer(s) may be affected.</li>
                  )}
                  <li>Affected buyers will be notified immediately.</li>
                  <li>Existing deal and chat records remain available for audit and safety.</li>
                  {confirming.action === "delete" && (
                    <li>The listing will no longer be visible in Browse.</li>
                  )}
                </ul>
              </div>
            ) : (
              <p className="confirm-description">
                This action cannot be undone. The listing will be removed from My Listings.
              </p>
            )}
            <div className="confirm-actions">
              <button className="secondary-action" onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button
                className={confirming.action === "delete" ? "destructive-action" : "primary-action"}
                onClick={confirmAction}
              >
                {confirming.action === "delete" ? "Delete listing" : "Continue to edit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type SellerReview = {
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

function SellerReviewsPage({
  reviews,
  onReviewsChange,
  onOpenListing,
  onAction,
  onRefresh,
}: {
  reviews: SellerReview[];
  onReviewsChange: (reviews: SellerReview[]) => void;
  onOpenListing: (listing: Listing) => void;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const [filter, setFilter] = useState<"All" | "Needs reply" | "Replied" | "Flagged">("All");
  const [ratingFilter, setRatingFilter] = useState("All ratings");
  const [replying, setReplying] = useState<SellerReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [flagging, setFlagging] = useState<SellerReview | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagDetails, setFlagDetails] = useState("");
  const [flagError, setFlagError] = useState("");
  const [notice, setNotice] = useState("");

  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;
  const visibleReviews = reviews.filter((review) => {
    const matchesStatus =
      filter === "All" ||
      (filter === "Needs reply" && !review.reply) ||
      (filter === "Replied" && Boolean(review.reply)) ||
      (filter === "Flagged" && review.flagged);
    const matchesRating =
      ratingFilter === "All ratings" || review.rating === Number(ratingFilter.slice(0, 1));
    return matchesStatus && matchesRating;
  });

  const openReply = (review: SellerReview) => {
    setReplying(review);
    setReplyText(review.reply ?? "");
    setReplyError("");
  };

  const submitReply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!replying) return;
    if (replyText.trim().length < 3) {
      setReplyError("Write a reply before sending.");
      return;
    }
    void api
      .replyToReview(replying.id, replyText.trim())
      .then(() => onRefresh())
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not send reply."));
    onReviewsChange(
      reviews.map((review) =>
        review.id === replying.id
          ? {
              ...review,
              reply: replyText.trim(),
              repliedAt: "Just now",
            }
          : review,
      ),
    );
    setNotice(`Reply sent. @${replying.buyer} received a notification.`);
    onAction(`@${replying.buyer} notified about your reply`);
    setReplying(null);
    setReplyText("");
  };

  const submitFlag = (event: React.FormEvent) => {
    event.preventDefault();
    if (!flagging) return;
    if (!flagReason) {
      setFlagError("Choose a reason for flagging this review.");
      return;
    }
    const reason = flagDetails.trim() ? `${flagReason}: ${flagDetails.trim()}` : flagReason;
    void api
      .flagReview(flagging.id, reason)
      .then(() => onRefresh())
      .catch((err) => onAction(err instanceof Error ? err.message : "Could not flag review."));
    onReviewsChange(
      reviews.map((review) =>
        review.id === flagging.id
          ? {
              ...review,
              flagged: true,
              flagReason: reason,
            }
          : review,
      ),
    );
    setNotice("Review flagged and sent to the Admin moderation queue.");
    onAction("Review submitted for Admin moderation");
    setFlagging(null);
    setFlagReason("");
    setFlagDetails("");
    setFlagError("");
  };

  return (
    <section>
      <div className="page-title seller-reviews-title">
        <div>
          <p className="eyebrow">SELLER PORTAL</p>
          <h1>Reviews & feedback</h1>
          <p>Read buyer feedback, respond professionally, and flag inappropriate reviews.</p>
        </div>
        <div className="seller-rating-summary">
          <strong>{averageRating.toFixed(1)}</strong>
          <div>
            <span aria-label={`${averageRating.toFixed(1)} out of 5 stars`}>★★★★★</span>
            <small>{reviews.length} buyer reviews</small>
          </div>
        </div>
      </div>

      {notice && (
        <div className="seller-action-notice review-notice">
          <span>✓</span>
          <p>{notice}</p>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <Icon name="x" size={15} />
          </button>
        </div>
      )}

      <div className="review-toolbar">
        <div className="review-filter-tabs">
          {(["All", "Needs reply", "Replied", "Flagged"] as const).map((option) => (
            <button
              key={option}
              className={filter === option ? "active" : ""}
              onClick={() => setFilter(option)}
            >
              {option}
              <span>
                {option === "All"
                  ? reviews.length
                  : option === "Needs reply"
                    ? reviews.filter((review) => !review.reply).length
                    : option === "Replied"
                      ? reviews.filter((review) => review.reply).length
                      : reviews.filter((review) => review.flagged).length}
              </span>
            </button>
          ))}
        </div>
        <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
          <option>All ratings</option>
          <option>5 stars</option>
          <option>4 stars</option>
          <option>3 stars</option>
          <option>2 stars</option>
          <option>1 star</option>
        </select>
      </div>

      {visibleReviews.length ? (
        <div className="seller-review-list">
          {visibleReviews.map((review) => (
            <article className="seller-review-card" key={review.id}>
              <div className="review-buyer-column">
                <div className="avatar">
                  {review.buyer
                    .split(".")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <strong>@{review.buyer}</strong>
                <span>{review.date}</span>
              </div>
              <div className="review-content-column">
                <div className="review-rating-row">
                  <div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span className={star <= review.rating ? "filled" : ""} key={star}>
                        ★
                      </span>
                    ))}
                    <strong>{review.rating}.0</strong>
                  </div>
                  {review.flagged && (
                    <span className="flagged-badge">
                      <Icon name="bell" size={12} />
                      Flagged for review
                    </span>
                  )}
                </div>
                <p className="review-text">“{review.text}”</p>
                <button
                  className="review-listing-context"
                  onClick={() => onOpenListing(review.listing)}
                >
                  <img src={review.listing.image} alt="" />
                  <span>
                    <small>RELATED LISTING</small>
                    <strong>{review.listing.title}</strong>
                  </span>
                  <Icon name="chevron" size={15} />
                </button>

                {review.reply && (
                  <div className="seller-review-reply">
                    <span className="reply-line" />
                    <div>
                      <span>YOUR REPLY · {review.repliedAt}</span>
                      <p>{review.reply}</p>
                    </div>
                  </div>
                )}

                {review.flagReason && (
                  <div className="flag-reason">
                    <strong>Flag submitted:</strong> {review.flagReason}
                  </div>
                )}

                <div className="review-card-actions">
                  <button className="secondary-action" onClick={() => openReply(review)}>
                    <Icon name="message" size={15} />
                    {review.reply ? "Edit reply" : "Reply"}
                  </button>
                  <button
                    className="flag-review-button"
                    disabled={review.flagged}
                    onClick={() => {
                      setFlagging(review);
                      setFlagReason("");
                      setFlagDetails("");
                      setFlagError("");
                    }}
                  >
                    <Icon name="bell" size={14} />
                    {review.flagged ? "Flag submitted" : "Flag review"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state seller-review-empty">
          <Icon name="star" size={29} />
          <h3>{reviews.length ? "No matching reviews" : "No reviews yet"}</h3>
          <p>
            {reviews.length
              ? "Try changing the reply status or rating filter."
              : "Buyer reviews will appear here after completed deals."}
          </p>
          {reviews.length > 0 && (
            <button
              className="secondary-action"
              onClick={() => {
                setFilter("All");
                setRatingFilter("All ratings");
              }}
            >
              Clear review filters
            </button>
          )}
        </div>
      )}

      {replying && (
        <div className="modal-backdrop" onMouseDown={() => setReplying(null)}>
          <form
            className="review-reply-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={submitReply}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setReplying(null)}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
            <p className="eyebrow">REPLY TO REVIEW</p>
            <h2>Respond to @{replying.buyer}</h2>
            <div className="reply-review-quote">
              <span>
                {"★".repeat(replying.rating)}
                {"☆".repeat(5 - replying.rating)}
              </span>
              <p>“{replying.text}”</p>
            </div>
            <label>
              Your reply
              <textarea
                rows={5}
                value={replyText}
                onChange={(event) => {
                  setReplyText(event.target.value);
                  setReplyError("");
                }}
                placeholder="Write a helpful, professional response..."
                autoFocus
              />
              <small>
                <Icon name="bell" size={12} />@{replying.buyer} will receive a notification when you
                send this reply.
              </small>
            </label>
            {replyError && <p className="form-error">{replyError}</p>}
            <div className="confirm-actions">
              <button type="button" className="secondary-action" onClick={() => setReplying(null)}>
                Cancel
              </button>
              <button className="primary-action">Send reply & notify buyer</button>
            </div>
          </form>
        </div>
      )}

      {flagging && (
        <div className="modal-backdrop" onMouseDown={() => setFlagging(null)}>
          <form
            className="flag-review-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={submitFlag}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setFlagging(null)}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
            <p className="eyebrow">FLAG REVIEW</p>
            <h2>Report inappropriate feedback</h2>
            <p>
              The review will remain visible until an Admin evaluates your report. Flags should not
              be used only because a rating is negative.
            </p>
            <label>
              Reason
              <select
                value={flagReason}
                onChange={(event) => {
                  setFlagReason(event.target.value);
                  setFlagError("");
                }}
              >
                <option value="">Choose a reason</option>
                <option>Abusive or harassing language</option>
                <option>Spam or unrelated content</option>
                <option>False information</option>
                <option>Personal information</option>
                <option>Other policy violation</option>
              </select>
            </label>
            <label>
              Additional details <span>Optional</span>
              <textarea
                rows={4}
                value={flagDetails}
                onChange={(event) => setFlagDetails(event.target.value)}
                placeholder="Give the moderator helpful context..."
              />
            </label>
            {flagError && <p className="form-error">{flagError}</p>}
            <div className="confirm-actions">
              <button type="button" className="secondary-action" onClick={() => setFlagging(null)}>
                Cancel
              </button>
              <button className="destructive-action">Submit flag</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

type SystemListing = {
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

function AllListingsPage({
  records,
  onRecordsChange,
  onOpenListing,
  onAction,
  onRefresh,
  users,
}: {
  records: SystemListing[];
  onRecordsChange: (records: SystemListing[]) => void;
  onOpenListing: (listing: Listing) => void;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
  users: MarketplaceUser[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [type, setType] = useState("All types");
  const [moderating, setModerating] = useState<{
    record: SystemListing;
    action: "approve" | "reject" | "remove";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const visible = records.filter(
    (record) =>
      (record.listing.title.toLowerCase().includes(query.toLowerCase()) ||
        record.listing.seller.toLowerCase().includes(query.toLowerCase())) &&
      (status === "All statuses" || record.status === status) &&
      (type === "All types" || record.listing.type === type),
  );

  const submitModeration = (event: React.FormEvent) => {
    event.preventDefault();
    if (!moderating) return;
    if (moderating.action !== "approve" && reason.trim().length < 10) {
      setError("Provide a reason of at least 10 characters.");
      return;
    }
    const nextStatus =
      moderating.action === "approve"
        ? "Live"
        : moderating.action === "reject"
          ? "Rejected"
          : "Removed";
    void api
      .moderateListing(moderating.record.listing.id, moderating.action, reason.trim() || undefined)
      .then(() => onRefresh())
      .then(() => {
        onAction(
          `${moderating.record.listing.title} ${moderating.action === "approve" ? "approved" : moderating.action === "reject" ? "rejected" : "removed"}; seller notified`,
        );
        setModerating(null);
        setReason("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Moderation failed."));
  };

  return (
    <section>
      <div className="page-title admin-page-title">
        <div>
          <p className="eyebrow">ADMIN PORTAL</p>
          <h1>All listings</h1>
          <p>Search, review, and moderate every listing across the marketplace.</p>
        </div>
        <button className="primary-action" onClick={() => setAdding((current) => !current)}>
          {adding ? "Close form" : "Add listing"}
        </button>
        <div className="admin-user-stats">
          <span>
            <strong>{records.length}</strong>Total
          </span>
          <span>
            <strong>{records.filter((item) => item.status === "Live").length}</strong>Live
          </span>
          <span>
            <strong>{records.filter((item) => item.status === "Pending Review").length}</strong>
            Pending
          </span>
        </div>
      </div>
      <div className="admin-user-toolbar admin-listing-toolbar">
        <label>
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or seller..."
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All statuses</option>
          {[
            "Pending Review",
            "Live",
            "Reserved",
            "Sold",
            "Lent",
            "Given",
            "Rejected",
            "Removed",
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option>All types</option>
          <option>Sell</option>
          <option>Lend</option>
          <option>Give Away</option>
        </select>
      </div>
      {adding && (
        <CreateListingForm
          onAction={(message) => {
            onAction(message);
            setAdding(false);
          }}
          onRefresh={onRefresh}
          users={users}
          role="Admin"
        />
      )}
      <div className="admin-result-count">
        <strong>{visible.length}</strong> listings found
      </div>
      {visible.length ? (
        <div className="admin-users-table-wrap standalone">
          <table className="admin-users-table admin-listings-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Seller</th>
                <th>Type</th>
                <th>Meet-up</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Quick actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((record) => (
                <tr key={record.id}>
                  <td>
                    <button className="history-item" onClick={() => onOpenListing(record.listing)}>
                      <img src={record.listing.image} alt="" />
                      <span>
                        <strong>{record.listing.title}</strong>
                        <small>{record.listing.category}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <strong className="admin-table-primary">@{record.listing.seller}</strong>
                    <small className="admin-table-secondary">{record.sellerFullName}</small>
                  </td>
                  <td>
                    <span
                      className={`history-type type-${record.listing.type.toLowerCase().replace(" ", "-")}`}
                    >
                      {record.listing.type}
                    </span>
                  </td>
                  <td>{record.listing.location}</td>
                  <td>
                    <span
                      className={`deal-status status-${record.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>{record.submitted}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button onClick={() => onOpenListing(record.listing)}>View</button>
                      {record.status === "Pending Review" && (
                        <>
                          <button onClick={() => setModerating({ record, action: "approve" })}>
                            Approve
                          </button>
                          <button
                            className="delete"
                            onClick={() => setModerating({ record, action: "reject" })}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {["Live", "Reserved"].includes(record.status) && (
                        <button
                          className="delete"
                          onClick={() => setModerating({ record, action: "remove" })}
                        >
                          Take down
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="search" size={28} />
          <h3>No listings found</h3>
          <p>Try changing your search or filters.</p>
        </div>
      )}
      {moderating && (
        <div className="modal-backdrop" onMouseDown={() => setModerating(null)}>
          <form
            className="admin-reject-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={submitModeration}
          >
            <button type="button" className="modal-close" onClick={() => setModerating(null)}>
              <Icon name="x" />
            </button>
            <p className="eyebrow">LISTING MODERATION</p>
            <h2>
              {moderating.action === "approve"
                ? "Approve listing?"
                : moderating.action === "reject"
                  ? "Reject listing?"
                  : "Take down listing?"}
            </h2>
            <p>
              “{moderating.record.listing.title}” by @{moderating.record.listing.seller}. The seller
              {moderating.action === "remove" ? " and affected buyers" : ""} will be notified.
            </p>
            {moderating.action !== "approve" && (
              <label>
                Written reason <span>Required</span>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setError("");
                  }}
                  placeholder="Provide a clear moderation reason..."
                  autoFocus
                />
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <div className="confirm-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setModerating(null)}
              >
                Cancel
              </button>
              <button
                className={
                  moderating.action === "approve" ? "primary-action" : "destructive-action"
                }
              >
                {moderating.action === "approve"
                  ? "Approve listing"
                  : moderating.action === "reject"
                    ? "Reject & notify"
                    : "Take down & notify"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

type SystemDeal = {
  id: number;
  title: string;
  buyer: string;
  seller: string;
  type: "Sold" | "Lent" | "Given";
  start: string;
  end: string;
  status: string;
};
function AllDealsPage({ deals }: { deals: SystemDeal[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [status, setStatus] = useState("All statuses");
  const visible = deals.filter(
    (deal) =>
      (deal.title.toLowerCase().includes(query.toLowerCase()) ||
        deal.buyer.includes(query.toLowerCase()) ||
        deal.seller.includes(query.toLowerCase())) &&
      (type === "All types" || deal.type === type) &&
      (status === "All statuses" || deal.status === status),
  );
  return (
    <section>
      <div className="page-title admin-page-title">
        <div>
          <p className="eyebrow">ADMIN PORTAL</p>
          <h1>All deals</h1>
          <p>System-wide record of sold, lent, and given items.</p>
        </div>
        <div className="admin-user-stats">
          <span>
            <strong>{deals.length}</strong>Total
          </span>
          <span>
            <strong>{deals.filter((d) => d.status === "Completed").length}</strong>Completed
          </span>
          <span>
            <strong>{deals.filter((d) => d.status === "In progress").length}</strong>Active
          </span>
        </div>
      </div>
      <div className="admin-user-toolbar admin-listing-toolbar">
        <label>
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item, buyer, or seller..."
          />
        </label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>All types</option>
          <option>Sold</option>
          <option>Lent</option>
          <option>Given</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All statuses</option>
          <option>Completed</option>
          <option>In progress</option>
          <option>Returned</option>
        </select>
      </div>
      <div className="admin-result-count">
        <strong>{visible.length}</strong> deals found
      </div>
      {visible.length ? (
        <div className="admin-users-table-wrap standalone">
          <table className="admin-users-table admin-deals-table">
            <thead>
              <tr>
                <th>Item title</th>
                <th>Buyer username</th>
                <th>Seller username</th>
                <th>Deal type</th>
                <th>Start date</th>
                <th>Return / complete date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((deal) => (
                <tr key={deal.id}>
                  <td>
                    <strong className="admin-table-primary">{deal.title}</strong>
                  </td>
                  <td>@{deal.buyer}</td>
                  <td>@{deal.seller}</td>
                  <td>
                    <span className={`history-type type-${deal.type.toLowerCase()}`}>
                      {deal.type}
                    </span>
                  </td>
                  <td>{deal.start}</td>
                  <td>{deal.end}</td>
                  <td>
                    <span
                      className={`history-outcome ${deal.status === "In progress" ? "in-progress" : ""}`}
                    >
                      {deal.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state admin-oversight-empty">
          <Icon name="search" size={28} />
          <h3>No deals found</h3>
          <p>Try changing your oversight filters.</p>
          <button
            className="secondary-action"
            onClick={() => {
              setQuery("");
              setType("All types");
              setStatus("All statuses");
            }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
}

type SellerRating = {
  seller: string;
  name: string;
  average: number;
  reviews: number;
  fiveStar: number;
  latest: string;
  listings: number;
};
function RatingsOverviewPage({
  ratings,
  reviews,
  onRefresh,
}: {
  ratings: SellerRating[];
  reviews: SellerReview[];
  onRefresh: () => Promise<unknown>;
}) {
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState("All ratings");
  const [selected, setSelected] = useState<SellerRating | null>(null);
  const visible = ratings.filter(
    (seller) =>
      (seller.seller.includes(query.toLowerCase()) ||
        seller.name.toLowerCase().includes(query.toLowerCase())) &&
      (rating === "All ratings" || seller.average >= Number(rating)),
  );
  const platformAverage = ratings.length
    ? ratings.reduce((sum, seller) => sum + seller.average, 0) / ratings.length
    : 0;
  return (
    <section>
      <div className="page-title admin-page-title">
        <div>
          <p className="eyebrow">ADMIN PORTAL</p>
          <h1>Seller ratings</h1>
          <p>Monitor seller reputation and drill into platform feedback.</p>
        </div>
        <div className="platform-rating">
          <strong>{platformAverage.toFixed(1)}</strong>
          <div>
            <span>★★★★★</span>
            <small>
              {ratings.reduce((sum, seller) => sum + seller.reviews, 0)} reviews across{" "}
              {ratings.length} sellers
            </small>
          </div>
        </div>
      </div>
      <div className="admin-user-toolbar ratings-toolbar">
        <label>
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search seller..."
          />
        </label>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option>All ratings</option>
          <option value="4.5">4.5+ stars</option>
          <option value="4">4.0+ stars</option>
        </select>
      </div>
      <div className="ratings-grid">
        {visible.map((seller) => (
          <article className="seller-rating-card" key={seller.seller}>
            <div className="seller-rating-head">
              <span className="avatar">
                {seller.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div>
                <h2>{seller.name}</h2>
                <p>
                  @{seller.seller} · {seller.listings} listings
                </p>
              </div>
              <strong>{seller.average.toFixed(1)}</strong>
            </div>
            <div className="seller-rating-stars" aria-label={`${seller.average} out of 5 stars`}>
              ★★★★★
            </div>
            <dl>
              <div>
                <dt>Reviews</dt>
                <dd>{seller.reviews}</dd>
              </div>
              <div>
                <dt>5-star</dt>
                <dd>{seller.fiveStar}</dd>
              </div>
              <div>
                <dt>Latest</dt>
                <dd>{seller.latest}</dd>
              </div>
            </dl>
            <button className="secondary-action" onClick={() => setSelected(seller)}>
              View seller ratings <Icon name="chevron" size={14} />
            </button>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state admin-oversight-empty">
          <Icon name="star" size={28} />
          <h3>No sellers found</h3>
          <p>Try changing the seller or rating filter.</p>
          <button
            className="secondary-action"
            onClick={() => {
              setQuery("");
              setRating("All ratings");
            }}
          >
            Clear rating filters
          </button>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <div className="seller-ratings-dialog" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              <Icon name="x" />
            </button>
            <p className="eyebrow">SELLER RATING DETAIL</p>
            <h2>{selected.name}</h2>
            <p>
              @{selected.seller} · {selected.reviews} verified buyer reviews
            </p>
            <div className="rating-detail-score">
              <strong>{selected.average.toFixed(1)}</strong>
              <span>
                ★★★★★<small>Platform average: {platformAverage.toFixed(1)}</small>
              </span>
            </div>
            <div className="rating-breakdown">
              {[5, 4, 3, 2, 1].map((star, index) => (
                <div key={star}>
                  <span>{star} ★</span>
                  <i>
                    <b className={`rating-bar rating-bar-${index}`} />
                  </i>
                  <small>{Math.max(0, selected.fiveStar - index * 3)}</small>
                </div>
              ))}
            </div>
            <div className="rating-detail-reviews">
              {reviews
                .filter(
                  (review) =>
                    review.sellerUsername === selected.seller ||
                    review.listing.seller === selected.seller,
                )
                .map((review) => (
                  <article key={review.id}>
                    <span>
                      {review.rating}.0 ★ · @{review.buyer}
                    </span>
                    <p>{review.text || "No written review."}</p>
                    <button
                      className="secondary-action"
                      onClick={() => {
                        void api
                          .hideRating(review.id, true)
                          .then(() => onRefresh());
                      }}
                    >
                      Hide review
                    </button>
                  </article>
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfilePage({
  role,
  currentUsername,
  users,
  onUsersChange,
  adminProfile,
  onAdminProfileChange,
  onRefresh,
}: {
  role: Role;
  currentUsername: string;
  users: MarketplaceUser[];
  onUsersChange: (users: MarketplaceUser[]) => void;
  adminProfile: AdminProfile;
  onAdminProfileChange: (profile: AdminProfile) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const account = users.find((user) => user.username === currentUsername);
  const [fullName, setFullName] = useState(
    role === "Admin" ? adminProfile.fullName : (account?.fullName ?? ""),
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState(account?.bio ?? "");
  const [meetups, setMeetups] = useState<string[]>(account?.meetups ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const locations = [
    "Academic Building Atrium",
    "Library Entrance",
    "Lee Shau Kee Business Building",
    "North Gate",
    "South Gate",
    "Hall I Lobby",
    "Hall IX Lobby",
    "Seafront Cafeteria",
  ];

  const resetForm = () => {
    const latest = users.find((user) => user.username === currentUsername);
    setFullName(role === "Admin" ? adminProfile.fullName : (latest?.fullName ?? ""));
    setPassword("");
    setConfirmPassword("");
    setBio(latest?.bio ?? "");
    setMeetups(latest?.meetups ?? []);
    setErrors({});
    setFeedback(null);
  };

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (password && !passwordRules.every((rule) => rule.test(password))) {
      nextErrors.password = "Your new password does not meet all strength requirements.";
    }
    if (password && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!password && confirmPassword) nextErrors.confirmPassword = "Enter a new password first.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setFeedback({ type: "error", message: "Please correct the highlighted fields." });
      return;
    }
    void api
      .updateOwnProfile({
        fullName: fullName.trim(),
        bio: role === "Seller" ? bio.trim() : undefined,
        meetups: role === "Seller" ? meetups : undefined,
        password: password || undefined,
      })
      .then(() => onRefresh())
      .then(() => {
        setPassword("");
        setConfirmPassword("");
        setErrors({});
        setFeedback({
          type: "success",
          message: password
            ? "Profile and password updated successfully."
            : "Profile changes saved successfully.",
        });
      })
      .catch((err) => {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Could not save profile.",
        });
      });
  };

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section>
      <div className="page-title">
        <p className="eyebrow">{role.toUpperCase()} PORTAL</p>
        <h1>Manage profile</h1>
        <p>Keep your account details accurate and secure.</p>
      </div>
      <form className="form-card profile-card" onSubmit={saveProfile} noValidate>
        <div className="profile-header">
          <div className="avatar large">{initials || "U"}</div>
          <div>
            <h3>{fullName || "Marketplace user"}</h3>
            <p>
              {role === "Admin" ? currentUsername : `@${currentUsername}`} · {role}
            </p>
          </div>
        </div>
        {feedback && (
          <div className={`profile-feedback ${feedback.type}`}>
            <span>{feedback.type === "success" ? "✓" : "!"}</span>
            {feedback.message}
          </div>
        )}
        <div className="form-grid">
          <label className={errors.fullName ? "profile-field-error" : ""}>
            Full name
            <input
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setErrors((current) => ({ ...current, fullName: "" }));
                setFeedback(null);
              }}
            />
            {errors.fullName && <small className="profile-error-text">{errors.fullName}</small>}
          </label>
          <label>
            Username
            <input value={currentUsername} disabled readOnly />
            <small className="field-helper">Usernames cannot be changed</small>
          </label>
          {role === "Seller" && (
            <>
              <label className="wide">
                Bio <span className="optional-label">Optional</span>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(event) => {
                    setBio(event.target.value);
                    setFeedback(null);
                  }}
                  placeholder="Tell buyers a little about you and what you usually sell..."
                />
              </label>
              <fieldset className="profile-meetups wide">
                <legend>
                  Preferred meet-up locations <span>Optional</span>
                </legend>
                <p>Select all HKUST locations that work for you.</p>
                <div>
                  {locations.map((location) => (
                    <label className={meetups.includes(location) ? "selected" : ""} key={location}>
                      <input
                        type="checkbox"
                        checked={meetups.includes(location)}
                        onChange={() => {
                          setMeetups((current) =>
                            current.includes(location)
                              ? current.filter((item) => item !== location)
                              : [...current, location],
                          );
                          setFeedback(null);
                        }}
                      />
                      <Icon name="pin" size={13} />
                      {location}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          <div className="profile-password-heading wide">
            <strong>Change password</strong>
            <span>Leave both fields blank to keep your current password.</span>
          </div>
          <label className={errors.password ? "profile-field-error" : ""}>
            New password
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: "" }));
                setFeedback(null);
              }}
              placeholder="Enter a new password"
              autoComplete="new-password"
            />
            {errors.password && <small className="profile-error-text">{errors.password}</small>}
          </label>
          <label className={errors.confirmPassword ? "profile-field-error" : ""}>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setErrors((current) => ({ ...current, confirmPassword: "" }));
                setFeedback(null);
              }}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <small className="profile-error-text">{errors.confirmPassword}</small>
            )}
          </label>
          <div className="password-rules profile-password-rules wide">
            {passwordRules.map((rule) => (
              <span className={password && rule.test(password) ? "met" : ""} key={rule.label}>
                {password && rule.test(password) ? "✓" : "○"} {rule.label}
              </span>
            ))}
          </div>
        </div>
        <div className="form-buttons">
          <button type="button" className="secondary-action" onClick={resetForm}>
            Cancel
          </button>
          <button className="primary-action">Save changes</button>
        </div>
      </form>
    </section>
  );
}

function SupportingPage({
  page,
  role,
  onAction,
  onRefresh,
  onOpenListing,
  onChatListing,
  onRecordFormalChat,
  onNavigate,
  buyerDealState,
  onBuyerDealsChange,
  sellerRequests,
  onSellerRequestsChange,
  notifications,
  notificationReads,
  onNotificationReadsChange,
  reviewListings,
  onReviewListingsChange,
  users,
  onUsersChange,
  sellerListingRecords,
  onSellerListingRecordsChange,
  sellerReviews,
  onSellerReviewsChange,
  systemListings,
  onSystemListingsChange,
  systemDeals,
  sellerRatings,
  historyDeals,
  sellerStats,
  liveListings,
  currentUsername,
  adminProfile,
  onAdminProfileChange,
  ratedDealIds,
  onRatedDealIdsChange,
}: {
  page: string;
  role: Role;
  onAction: (message: string) => void;
  onRefresh: () => Promise<unknown>;
  onOpenListing: (listing: Listing) => void;
  onChatListing: (listing: Listing, participant?: string) => void;
  onRecordFormalChat: (listing: Listing, buyer: string, body: string) => void;
  onNavigate: (page: string) => void;
  buyerDealState: BuyerDeal[];
  onBuyerDealsChange: (deals: BuyerDeal[]) => void;
  sellerRequests: SellerRequest[];
  onSellerRequestsChange: (requests: SellerRequest[]) => void;
  notifications: NotificationItem[];
  notificationReads: number[];
  onNotificationReadsChange: (ids: number[]) => void;
  reviewListings: ReviewListing[];
  onReviewListingsChange: (records: ReviewListing[]) => void;
  users: MarketplaceUser[];
  onUsersChange: (users: MarketplaceUser[]) => void;
  sellerListingRecords: SellerListingRecord[];
  onSellerListingRecordsChange: (records: SellerListingRecord[]) => void;
  sellerReviews: SellerReview[];
  onSellerReviewsChange: (reviews: SellerReview[]) => void;
  systemListings: SystemListing[];
  onSystemListingsChange: (records: SystemListing[]) => void;
  systemDeals: SystemDeal[];
  sellerRatings: SellerRating[];
  historyDeals: api.HistoryDeal[];
  sellerStats: api.SellerStats;
  liveListings: Listing[];
  currentUsername: string;
  adminProfile: AdminProfile;
  onAdminProfileChange: (profile: AdminProfile) => void;
  ratedDealIds: number[];
  onRatedDealIdsChange: (ids: number[]) => void;
}) {
  const data = pageData[page] ?? {
    title: page,
    subtitle: `Manage your ${role.toLowerCase()} activity.`,
  };

  if (page === "My Deals") {
    return (
      <MyDealsPage
        deals={buyerDealState}
        onDealsChange={onBuyerDealsChange}
        onOpenListing={onOpenListing}
        onChatListing={onChatListing}
        onAction={onAction}
        onRefresh={onRefresh}
      />
    );
  }

  if (page === "Deal History") {
    return <DealHistoryPage deals={historyDeals} onOpenListing={onOpenListing} />;
  }

  if (page === "Rate Sellers") {
    return (
      <RateSellersPage
        deals={buyerDealState}
        ratedDealIds={ratedDealIds}
        onRatedDealIdsChange={onRatedDealIdsChange}
        onOpenListing={onOpenListing}
        onAction={onAction}
        onRefresh={onRefresh}
      />
    );
  }

  if (page === "Offers / Requests") {
    return (
      <SellerRequestsPage
        requests={sellerRequests}
        onRequestsChange={onSellerRequestsChange}
        buyerDealState={buyerDealState}
        onBuyerDealsChange={onBuyerDealsChange}
        onChatListing={onChatListing}
        onRecordFormalChat={onRecordFormalChat}
        onAction={onAction}
        onRefresh={onRefresh}
      />
    );
  }

  if (page === "Notifications") {
    const listings = [
      ...liveListings,
      ...reviewListings.map((record) => record.listing),
      ...sellerListingRecords.map((record) => record.listing),
      ...systemListings.map((record) => record.listing),
    ].filter((listing, index, all) => all.findIndex((item) => item.id === listing.id) === index);
    return (
      <NotificationBoard
        role={role}
        items={notifications}
        listings={listings}
        sellerRequests={sellerRequests}
        buyerDeals={buyerDealState}
        readIds={notificationReads}
        onReadIdsChange={onNotificationReadsChange}
        onOpenListing={onOpenListing}
        onChatListing={onChatListing}
        onNavigate={onNavigate}
      />
    );
  }

  if (page === "Listing Review") {
    return (
      <ListingReviewPage
        records={reviewListings}
        onRecordsChange={onReviewListingsChange}
        onAction={onAction}
        onRefresh={onRefresh}
        onOpenListing={onOpenListing}
      />
    );
  }

  if (page === "All Users") {
    return (
      <ManageUsersPage
        users={users}
        onUsersChange={onUsersChange}
        onAction={onAction}
        onRefresh={onRefresh}
      />
    );
  }

  if (page === "My Listings") {
    return (
      <SellerListingsPage
        records={sellerListingRecords}
        onRecordsChange={onSellerListingRecordsChange}
        onOpenListing={onOpenListing}
        onAction={onAction}
        onRefresh={onRefresh}
      />
    );
  }

  if (page === "Reviews") {
    return (
      <SellerReviewsPage
        reviews={sellerReviews.filter(
          (review) =>
            review.sellerUsername === currentUsername || review.listing.seller === currentUsername,
        )}
        onReviewsChange={onSellerReviewsChange}
        onOpenListing={onOpenListing}
        onAction={onAction}
        onRefresh={onRefresh}
      />
    );
  }

  if (page === "All Listings") {
    return (
      <AllListingsPage
        records={systemListings}
        onRecordsChange={onSystemListingsChange}
        onOpenListing={onOpenListing}
        onAction={onAction}
        onRefresh={onRefresh}
        users={users}
      />
    );
  }

  if (page === "All Deals") {
    return <AllDealsPage deals={systemDeals} />;
  }

  if (page === "Ratings Overview") {
    return (
      <RatingsOverviewPage ratings={sellerRatings} reviews={sellerReviews} onRefresh={onRefresh} />
    );
  }

  if (page === "Create Listing") {
    return (
      <CreateListingForm
        onAction={onAction}
        onRefresh={onRefresh}
        users={users}
        role={role}
      />
    );
  }

  if (page === "Profile") {
    return (
      <ProfilePage
        role={role}
        currentUsername={currentUsername}
        users={users}
        onUsersChange={onUsersChange}
        adminProfile={adminProfile}
        onAdminProfileChange={onAdminProfileChange}
        onRefresh={onRefresh}
      />
    );
  }

  const isStats = page === "Stats";
  return (
    <section>
      <div className="page-title">
        <p className="eyebrow">{role.toUpperCase()} PORTAL</p>
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
      </div>
      <div className="metric-grid">
        {(isStats
          ? [
              ["Listing views", sellerStats.views.toLocaleString()],
              ["Offers received", String(sellerStats.offers)],
              ["Completed deals", String(sellerStats.completed)],
              ["Average rating", `${sellerStats.averageRating || "—"} ★`],
            ]
          : [
              ["Needs attention", String(notifications.filter((item) => !notificationReads.includes(item.id)).length)],
              ["Active", String(buyerDealState.filter((deal) => !deal.completed).length || sellerListingRecords.filter((record) => record.status === "Live").length)],
              ["Completed", String(sellerStats.completed || historyDeals.length)],
              ["Live listings", String(liveListings.length)],
            ]
        ).map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Updated just now</small>
          </div>
        ))}
      </div>
      {isStats ? (
        <div className="stats-chart-grid">
          <div className="activity-card stats-chart-card">
            <div className="activity-head">
              <div>
                <h3>Views by listing</h3>
                <p>Last 30 days</p>
              </div>
              <button className="filter-button">View all</button>
            </div>
            <div className="bar-chart">
              {(sellerStats.viewsByListing.length
                ? sellerStats.viewsByListing
                : [{ title: "No listings yet", views: 0 }]
              ).map((item) => {
                const max = Math.max(1, ...sellerStats.viewsByListing.map((row) => row.views));
                return (
                  <div key={item.title}>
                    <span style={{ height: `${Math.max(8, Math.round((item.views / max) * 100))}%` }}></span>
                    <small>{item.title.slice(0, 10)}</small>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="activity-card stats-chart-card donut-card">
            <div className="activity-head">
              <div>
                <h3>Deals by type</h3>
                <p>Completed marketplace deals</p>
              </div>
              <span className="chart-total-label">{sellerStats.completed} total</span>
            </div>
            <div className="donut-chart-wrap">
              <div
                className="donut-chart"
                role="img"
                aria-label={`Deals by type: ${sellerStats.dealsByType.map((item) => `${item.count} ${item.label}`).join(", ")}`}
              >
                <div>
                  <strong>{sellerStats.completed}</strong>
                  <span>DEALS</span>
                </div>
              </div>
              <div className="donut-legend">
                {sellerStats.dealsByType.map((item) => {
                  const percentage = sellerStats.completed
                    ? `${Math.round((item.count / sellerStats.completed) * 100)}%`
                    : "0%";
                  const label = item.label;
                  const count = String(item.count);
                  const tone = item.tone;
                  return (
                  <div key={label}>
                    <i className={`legend-${tone}`} />
                    <span>
                      <strong>{label}</strong>
                      <small>{count} deals</small>
                    </span>
                    <b>{percentage}</b>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="activity-card">
          <div className="activity-head">
            <div>
              <h3>Recent activity</h3>
              <p>Latest marketplace updates</p>
            </div>
            <button className="filter-button">View all</button>
          </div>
          <div className="activity-list">
            {[
              ["Sony WH-1000XM4", "New offer from @charlie.l", "10 min ago"],
              ["Road Bike — Weekend Loan", "Borrow request awaiting response", "1 hour ago"],
              ["COMP 3111 Course Notes", "Listing status updated", "Yesterday"],
            ].map(([title, desc, time], i) => (
              <button key={title} onClick={() => onAction(`Opened ${title}`)}>
                <span className={`activity-icon tone-${i}`}>
                  <Icon name={i === 0 ? "bag" : i === 1 ? "clock" : "check"} size={18} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <time>{time}</time>
                <Icon name="chevron" size={17} />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function AuthPortal({
  view,
  users,
  adminProfile,
  notice,
  onViewChange,
  onRegister,
  onLogin,
}: {
  view: AuthView;
  users: MarketplaceUser[];
  adminProfile: AdminProfile;
  notice: string;
  onViewChange: (view: AuthView) => void;
  onRegister: (user: MarketplaceUser) => void;
  onLogin: (role: Role, username: string) => void | Promise<void>;
}) {
  const [loginRole, setLoginRole] = useState<"Buyer" | "Seller">("Buyer");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [residence, setResidence] = useState("");
  const [bio, setBio] = useState("");
  const [meetups, setMeetups] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const switchView = (nextView: AuthView) => {
    setError("");
    setFieldErrors({});
    onViewChange(nextView);
  };

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const expectedRole: Role = view === "admin-login" ? "Admin" : loginRole;
      const result = await api.loginAccount({
        username: loginUsername,
        password: loginPassword,
        expectedRole,
      });
      await onLogin(result.role, result.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Try again.");
    }
  };

  const submitRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    const role = view === "seller-register" ? "Seller" : "Buyer";
    const nextErrors: Record<string, string> = {};
    const normalized = username.trim().toLowerCase();

    if (!normalized) nextErrors.username = "Choose a username.";
    if (normalized === "admin@ust.hk") {
      nextErrors.username = "This username is reserved for the administrator.";
    }
    if (!fullName.trim()) nextErrors.fullName = "Enter your full name.";
    if (!passwordRules.every((rule) => rule.test(password))) {
      nextErrors.password = "Your password does not meet all strength requirements.";
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length) return;

    try {
      await api.registerAccount({
        username: normalized,
        fullName: fullName.trim(),
        password,
        role,
        residence: residence || undefined,
        bio: role === "Seller" ? bio.trim() || undefined : undefined,
        meetups: role === "Seller" ? meetups : undefined,
      });
      onRegister({
        username: normalized,
        fullName: fullName.trim(),
        role,
        residence: residence || undefined,
        bio: role === "Seller" ? bio.trim() || undefined : undefined,
        meetups: role === "Seller" ? meetups : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      if (message.toLowerCase().includes("username")) {
        setFieldErrors({ username: message });
      } else {
        setError(message);
      }
    }
  };

  const toggleMeetup = (location: string) => {
    setMeetups((current) =>
      current.includes(location)
        ? current.filter((item) => item !== location)
        : [...current, location],
    );
  };

  const isRegister = view === "buyer-register" || view === "seller-register";
  const registerRole = view === "seller-register" ? "Seller" : "Buyer";

  return (
    <div className="auth-shell">
      <section className="auth-brand-panel">
        <Logo />
        <div className="auth-brand-copy">
          <p className="eyebrow">HKUST COMMUNITY</p>
          <h1>A trusted campus marketplace, built for us.</h1>
          <p>
            Buy, lend, give away, and discover useful items from verified members of the HKUST
            community.
          </p>
          <div className="auth-trust-list">
            <span>
              <Icon name="check" size={18} />
              Role-aware accounts and private dashboards
            </span>
            <span>
              <Icon name="message" size={18} />
              Listing-linked chat and formal offers
            </span>
            <span>
              <Icon name="pin" size={18} />
              Safe meet-ups at familiar campus locations
            </span>
          </div>
        </div>
        <small>HKUST Marketplace · Students and staff only</small>
      </section>

      <main className="auth-main">
        <div className={`auth-card ${isRegister ? "registration-card" : ""}`}>
          <div className="auth-mobile-logo">
            <Logo />
          </div>

          {isRegister ? (
            <>
              <div className="auth-heading">
                <p className="eyebrow">{registerRole.toUpperCase()} ACCOUNT</p>
                <h2>Create your {registerRole.toLowerCase()} account</h2>
                <p>
                  Already registered?{" "}
                  <button onClick={() => switchView("login")}>Sign in instead</button>
                </p>
              </div>

              <form className="auth-form" onSubmit={submitRegistration} noValidate>
                <div className="auth-form-grid">
                  <label className={fieldErrors.username ? "has-error" : ""}>
                    Username
                    <input
                      value={username}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        setFieldErrors((current) => ({ ...current, username: "" }));
                      }}
                      placeholder="e.g. alex.chan"
                      autoComplete="username"
                    />
                    {fieldErrors.username ? (
                      <small>{fieldErrors.username}</small>
                    ) : (
                      <span>Must be unique across Buyer, Seller, and Admin accounts</span>
                    )}
                  </label>
                  <label className={fieldErrors.fullName ? "has-error" : ""}>
                    Full name
                    <input
                      value={fullName}
                      onChange={(event) => {
                        setFullName(event.target.value);
                        setFieldErrors((current) => ({ ...current, fullName: "" }));
                      }}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                    {fieldErrors.fullName && <small>{fieldErrors.fullName}</small>}
                  </label>
                  <label className={`wide ${fieldErrors.password ? "has-error" : ""}`}>
                    Password
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setFieldErrors((current) => ({ ...current, password: "" }));
                      }}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                    />
                    {fieldErrors.password && <small>{fieldErrors.password}</small>}
                  </label>
                  <div className="password-rules wide">
                    {passwordRules.map((rule) => (
                      <span className={rule.test(password) ? "met" : ""} key={rule.label}>
                        {rule.test(password) ? "✓" : "○"} {rule.label}
                      </span>
                    ))}
                  </div>
                  <label className={`wide ${fieldErrors.confirmPassword ? "has-error" : ""}`}>
                    Confirm password
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setFieldErrors((current) => ({ ...current, confirmPassword: "" }));
                      }}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                    {fieldErrors.confirmPassword && <small>{fieldErrors.confirmPassword}</small>}
                  </label>
                  <label className="wide">
                    Residence hall <span>Optional</span>
                    <select
                      value={residence}
                      onChange={(event) => setResidence(event.target.value)}
                    >
                      <option value="">Select residence or off-campus</option>
                      <option>Hall I</option>
                      <option>Hall II</option>
                      <option>Hall III</option>
                      <option>Hall IV</option>
                      <option>Hall V</option>
                      <option>Hall VI</option>
                      <option>Hall VII</option>
                      <option>Hall VIII</option>
                      <option>Hall IX</option>
                      <option>Jockey Club Hall</option>
                      <option>Off-campus</option>
                    </select>
                  </label>

                  {registerRole === "Seller" && (
                    <>
                      <label className="wide">
                        Bio <span>Optional</span>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(event) => setBio(event.target.value)}
                          placeholder="Tell buyers a little about what you usually sell..."
                        />
                      </label>
                      <fieldset className="meetup-preferences wide">
                        <legend>
                          Preferred meet-up locations <span>Optional</span>
                        </legend>
                        <div>
                          {[
                            "Academic Building Atrium",
                            "Library Entrance",
                            "North Gate",
                            "South Gate",
                          ].map((location) => (
                            <label key={location}>
                              <input
                                type="checkbox"
                                checked={meetups.includes(location)}
                                onChange={() => toggleMeetup(location)}
                              />
                              {location}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  )}
                </div>
                <button className="primary-action auth-submit">
                  Create {registerRole} account
                  <Icon name="arrow" size={17} />
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="auth-heading">
                <p className="eyebrow">
                  {view === "admin-login" ? "ADMIN PORTAL" : "WELCOME BACK"}
                </p>
                <h2>{view === "admin-login" ? "Admin sign in" : "Sign in to Marketplace"}</h2>
                <p>
                  {view === "admin-login"
                    ? "Access is restricted to the seeded administrator account."
                    : "Choose the same role used when your account was created."}
                </p>
              </div>

              {notice && (
                <div className="auth-notice">
                  <span>✓</span>
                  {notice}
                </div>
              )}

              {view === "login" && (
                <div className="login-role-picker">
                  {(["Buyer", "Seller"] as const).map((role) => (
                    <button
                      key={role}
                      className={loginRole === role ? "active" : ""}
                      onClick={() => {
                        setLoginRole(role);
                        setError("");
                      }}
                    >
                      <Icon name={role === "Buyer" ? "bag" : "grid"} size={18} />
                      {role}
                    </button>
                  ))}
                </div>
              )}

              <form className="auth-form login-form" onSubmit={submitLogin}>
                {error && (
                  <div className="auth-error" role="alert">
                    <span>!</span>
                    {error}
                  </div>
                )}
                <label>
                  {view === "admin-login" ? "Admin email" : "Username"}
                  <input
                    value={loginUsername}
                    onChange={(event) => {
                      setLoginUsername(event.target.value);
                      setError("");
                    }}
                    placeholder={view === "admin-login" ? "admin@ust.hk" : "Enter your username"}
                    autoComplete="username"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(event) => {
                      setLoginPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button className="primary-action auth-submit">
                  Sign in as {view === "admin-login" ? "Admin" : loginRole}
                  <Icon name="arrow" size={17} />
                </button>
              </form>

              <div className="auth-links">
                {view === "admin-login" ? (
                  <button onClick={() => switchView("login")}>Back to Buyer / Seller login</button>
                ) : (
                  <>
                    <span>New to HKUST Marketplace?</span>
                    <div>
                      <button onClick={() => switchView("buyer-register")}>
                        Register as Buyer
                      </button>
                      <i />
                      <button onClick={() => switchView("seller-register")}>
                        Register as Seller
                      </button>
                    </div>
                    <button className="admin-link" onClick={() => switchView("admin-login")}>
                      Admin Login
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [authView, setAuthView] = useState<AuthView>("login");
  const [users, setUsers] = useState<MarketplaceUser[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>({
    username: "admin@ust.hk",
    password: "",
    fullName: "Marketplace Admin",
  });
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [role, setRole] = useState<Role>("Buyer");
  const [page, setPage] = useState("Browse");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [profileSeller, setProfileSeller] = useState<string | null>(null);
  const [chatListing, setChatListing] = useState<Listing | null>(null);
  const [chatCounterparty, setChatCounterparty] = useState("");
  const [chatThreadId, setChatThreadId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<number, ChatMessage[]>>({});
  const [listingChatPeople, setListingChatPeople] = useState<
    { id: string; buyer: string; lastMessage: string }[]
  >([]);
  const [buyerDealState, setBuyerDealState] = useState<BuyerDeal[]>([]);
  const [ratedDealIds, setRatedDealIds] = useState<number[]>([]);
  const [sellerRequests, setSellerRequests] = useState<SellerRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationReads, setNotificationReads] = useState<number[]>([]);
  const [reviewListings, setReviewListings] = useState<ReviewListing[]>([]);
  const [sellerListingRecords, setSellerListingRecords] = useState<SellerListingRecord[]>([]);
  const [sellerReviews, setSellerReviews] = useState<SellerReview[]>([]);
  const [systemListings, setSystemListings] = useState<SystemListing[]>([]);
  const [systemDeals, setSystemDeals] = useState<SystemDeal[]>([]);
  const [sellerRatings, setSellerRatings] = useState<SellerRating[]>([]);
  const [historyDeals, setHistoryDeals] = useState<api.HistoryDeal[]>([]);
  const [liveListings, setLiveListings] = useState<Listing[]>([]);
  const [sellerStats, setSellerStats] = useState<api.SellerStats>({
    views: 0,
    offers: 0,
    completed: 0,
    averageRating: 0,
    viewsByListing: [],
    dealsByType: [
      { label: "Sold", count: 0, tone: "sold" },
      { label: "Lent", count: 0, tone: "lent" },
      { label: "Given", count: 0, tone: "given" },
    ],
  });
  const [toast, setToast] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  };

  const applySnapshot = (snap: api.MarketplaceSnapshot) => {
    setUsers(snap.users);
    setAdminProfile(snap.adminProfile);
    setCurrentUsername(snap.currentUsername);
    setCurrentUserId(snap.currentUserId);
    setRole(snap.role);
    setLiveListings(snap.liveListings);
    setBuyerDealState(snap.buyerDeals);
    setRatedDealIds(snap.ratedDealIds);
    setSellerRequests(snap.sellerRequests);
    setNotifications(snap.notifications);
    setNotificationReads(snap.readNotificationIds);
    setReviewListings(snap.reviewListings);
    setSellerListingRecords(snap.sellerListingRecords);
    setSellerReviews(snap.sellerReviews);
    setSystemListings(snap.systemListings);
    setSystemDeals(snap.systemDeals);
    setSellerRatings(snap.sellerRatings);
    setHistoryDeals(snap.historyDeals);
    setSellerStats(snap.sellerStats);
  };

  const refresh = async () => {
    const snap = await api.loadSnapshot();
    applySnapshot(snap);
    return snap;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await api.restoreSession();
        if (!cancelled && session) {
          const snap = await api.loadSnapshot();
          if (!cancelled) {
            applySnapshot(snap);
            setPage(navByRole[snap.role][0].label);
            setAuthenticated(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          await api.logoutAccount();
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authenticated || !currentUserId) return;
    return api.subscribeMyNotifications(currentUserId, {
      onInsert: (item, read) => {
        setNotifications((current) =>
          current.some((entry) => entry.id === item.id) ? current : [item, ...current],
        );
        if (read) {
          setNotificationReads((ids) => (ids.includes(item.id) ? ids : [...ids, item.id]));
        }
      },
      onUpdate: (item, read) => {
        setNotifications((current) =>
          current.some((entry) => entry.id === item.id)
            ? current.map((entry) => (entry.id === item.id ? item : entry))
            : [item, ...current],
        );
        setNotificationReads((ids) => {
          if (read) return ids.includes(item.id) ? ids : [...ids, item.id];
          return ids.filter((id) => id !== item.id);
        });
      },
    });
  }, [authenticated, currentUserId]);

  useEffect(() => {
    if (!authenticated || !currentUserId || !chatListing || chatThreadId == null) return;
    const listingId = chatListing.id;
    return api.subscribeChatThread(chatThreadId, role, currentUserId, (message) => {
      setChatMessages((current) => {
        const list = current[listingId] ?? [];
        const next = api.mergeRealtimeChatMessage(list, message);
        if (next === list) return current;
        return { ...current, [listingId]: next };
      });
    });
  }, [authenticated, currentUserId, chatListing?.id, chatThreadId, role]);

  useEffect(() => {
    if (!selected) {
      setListingChatPeople([]);
      return;
    }
    const listingId = selected.id;
    let cancelled = false;
    void api
      .listListingChatPeople(listingId)
      .then((people) => {
        if (!cancelled) setListingChatPeople(people);
      })
      .catch(() => {
        if (!cancelled) setListingChatPeople([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  const recordFormalChat = async (listing: Listing, buyerUsername: string, body: string) => {
    try {
      const buyer = users.find((user) => user.username === buyerUsername);
      const threadId = await api.openChat(
        listing.id,
        role === "Buyer" ? currentUserId : buyer?.id,
      );
      await api.sendChatMessage(threadId, body, "offer", role);
      const loaded = await api.loadChatMessages(threadId, role);
      setChatThreadId(threadId);
      setChatMessages((current) => ({ ...current, [listing.id]: loaded }));
    } catch {
      /* chat recording should not block the counter itself */
    }
  };

  const openChat = async (listing: Listing, participant?: string) => {
    try {
      const buyerUsername = role === "Buyer" ? currentUsername : (participant ?? "");
      const buyer = users.find((user) => user.username === buyerUsername);
      const buyerId =
        role === "Buyer"
          ? currentUserId
          : (buyer?.id ?? (buyerUsername ? await api.profileIdByUsername(buyerUsername) : null));
      const threadId = await api.openChat(listing.id, buyerId ?? undefined);
      const messages = await api.loadChatMessages(threadId, role);
      setChatThreadId(threadId);
      setChatMessages((current) => ({ ...current, [listing.id]: messages }));
      setSelected(null);
      setChatCounterparty(participant ?? listing.seller);
      setChatListing(listing);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not open chat.");
    }
  };

  const login = async (nextRole: Role, username: string) => {
    const snap = await refresh();
    setRole(snap.role);
    setCurrentUsername(snap.currentUsername);
    setPage(navByRole[snap.role][0].label);
    setChatListing(null);
    setChatThreadId(null);
    setAuthenticated(true);
    setAuthNotice("");
    void nextRole;
    void username;
  };

  const register = (user: MarketplaceUser) => {
    setAuthNotice(`Account @${user.username} created. Sign in with your ${user.role} role.`);
    setAuthView("login");
  };

  const logout = async () => {
    await api.logoutAccount();
    setAuthenticated(false);
    setCurrentUsername("");
    setCurrentUserId("");
    setAuthView("login");
    setSelected(null);
    setProfileSeller(null);
    setChatListing(null);
    setChatThreadId(null);
  };

  if (bootstrapping) {
    return (
      <div className="auth-shell">
        <main className="auth-main">
          <div className="auth-card">
            <p className="eyebrow">HKUST MARKETPLACE</p>
            <h2>Loading your session…</h2>
          </div>
        </main>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AuthPortal
        view={authView}
        users={users}
        adminProfile={adminProfile}
        notice={authNotice}
        onViewChange={(nextView) => {
          setAuthNotice("");
          setAuthView(nextView);
        }}
        onRegister={register}
        onLogin={login}
      />
    );
  }

  const signedInUser = users.find((user) => user.username === currentUsername);
  const displayName =
    role === "Admin" ? adminProfile.fullName : (signedInUser?.fullName ?? "Alex Chan");
  const displayInitials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const unreadNotificationCount = notifications.filter(
    (item) => !notificationReads.includes(item.id),
  ).length;
  const selectedListingOffers = selected
    ? withListingChatPeople(
        mergeListingOffers(
          selected.seller === currentUsername
            ? sellerRequests
                .filter((request) => request.listing.id === selected.id)
                .map((request) => ({
                  id: request.id,
                  buyer: request.buyer,
                  type: request.type,
                  detail: request.detail,
                  status: request.status,
                }))
            : buyerDealState
                .filter((deal) => deal.listing.id === selected.id)
                .map((deal) => ({
                  id: deal.id,
                  buyer: currentUsername,
                  type: deal.kind,
                  detail: deal.detail,
                  status: deal.status,
                })),
          chatOffersForListing(
            selected,
            chatMessages[selected.id] ?? [],
            selected.seller === currentUsername
              ? chatListing?.id === selected.id
                ? chatCounterparty
                : ""
              : currentUsername,
          ),
        ),
        listingChatPeople,
      )
    : [];
  const mobileNavItems =
    role === "Seller"
      ? navByRole.Seller.filter((item) =>
          ["Create Listing", "My Listings", "Offers / Requests", "Reviews", "Profile"].includes(
            item.label,
          ),
        )
      : role === "Admin"
        ? navByRole.Admin.filter((item) =>
            ["Listing Review", "All Listings", "All Users", "All Deals", "Profile"].includes(
              item.label,
            ),
          )
        : navByRole.Buyer.filter((item) =>
            ["Browse", "My Deals", "Rate Sellers", "Notifications", "Profile"].includes(item.label),
          );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <div className="role-switcher">
          <span>SIGNED IN AS</span>
          <p>
            {role === "Admin" ? currentUsername : `@${currentUsername}`} ({role})
          </p>
        </div>
        <nav>
          {navByRole[role].map((item) => (
            <button
              key={item.label}
              className={page === item.label ? "active" : ""}
              onClick={() => {
                setChatListing(null);
                setPage(item.label);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Notifications" && unreadNotificationCount > 0 && (
                <b>{unreadNotificationCount}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{displayInitials}</div>
          <div>
            <strong>{displayName}</strong>
            <small>{role === "Admin" ? currentUsername : `@${currentUsername}`}</small>
          </div>
          <button className="sign-out-button" onClick={logout} aria-label="Sign out">
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </aside>

      <main>
        <header className="mobile-header">
          <Logo />
          <button
            onClick={() => {
              setChatListing(null);
              setPage("Notifications");
            }}
            aria-label="Notifications"
          >
            <Icon name="bell" />
            {unreadNotificationCount > 0 && <span />}
          </button>
        </header>
        <div className="content-wrap">
          {chatListing ? (
            <ChatScreen
              listing={chatListing}
              role={role}
              threadId={chatThreadId}
              counterparty={chatCounterparty || chatListing.seller}
              activeOfferId={
                sellerRequests.find(
                  (request) =>
                    request.listing.id === chatListing.id &&
                    request.buyer === chatCounterparty &&
                    (request.status === "Pending" || request.status === "Countered"),
                )?.id ?? null
              }
              messages={chatMessages[chatListing.id] ?? []}
              onMessagesChange={(messages) =>
                setChatMessages((current) => ({
                  ...current,
                  [chatListing.id]:
                    typeof messages === "function"
                      ? messages(current[chatListing.id] ?? [])
                      : messages,
                }))
              }
              onBack={() => {
                setChatListing(null);
                setChatThreadId(null);
              }}
              onOpenListing={(listing) => {
                setSelected(listing);
                void refresh();
              }}
              onRefresh={refresh}
              onAction={showToast}
            />
          ) : role === "Buyer" && page === "Browse" ? (
            <Browse listings={liveListings} onOpen={setSelected} />
          ) : (
            <SupportingPage
              page={page}
              role={role}
              onAction={showToast}
              onRefresh={refresh}
              onOpenListing={setSelected}
              onChatListing={openChat}
              onRecordFormalChat={recordFormalChat}
              onNavigate={setPage}
              buyerDealState={buyerDealState}
              onBuyerDealsChange={setBuyerDealState}
              sellerRequests={sellerRequests}
              onSellerRequestsChange={setSellerRequests}
              notifications={notifications}
              notificationReads={notificationReads}
              onNotificationReadsChange={setNotificationReads}
              reviewListings={reviewListings}
              onReviewListingsChange={setReviewListings}
              users={users}
              onUsersChange={setUsers}
              sellerListingRecords={sellerListingRecords}
              onSellerListingRecordsChange={setSellerListingRecords}
              sellerReviews={sellerReviews}
              onSellerReviewsChange={setSellerReviews}
              systemListings={systemListings}
              onSystemListingsChange={setSystemListings}
              systemDeals={systemDeals}
              sellerRatings={sellerRatings}
              historyDeals={historyDeals}
              sellerStats={sellerStats}
              liveListings={liveListings}
              currentUsername={currentUsername}
              adminProfile={adminProfile}
              onAdminProfileChange={setAdminProfile}
              ratedDealIds={ratedDealIds}
              onRatedDealIdsChange={setRatedDealIds}
            />
          )}
          {!chatListing && (
            <footer>
              <Logo />
              <p>A trusted marketplace for the HKUST community.</p>
              <span>© 2026 HKUST Marketplace · Community guidelines · Safety</span>
            </footer>
          )}
        </div>
      </main>

      <nav className="mobile-nav">
        {mobileNavItems.map((item) => (
          <button
            key={item.label}
            className={page === item.label ? "active" : ""}
            onClick={() => {
              setChatListing(null);
              setPage(item.label);
            }}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label.replace(" / ", " ")}</span>
          </button>
        ))}
      </nav>
      {selected && (
        <DetailModal
          listing={selected}
          role={role}
          currentUsername={currentUsername}
          listingOffers={selectedListingOffers}
          onClose={() => setSelected(null)}
          onAction={(message) => {
            showToast(message);
            setSelected(null);
            void refresh();
          }}
          onChat={(participant) => openChat(selected, participant)}
          onViewSeller={() => {
            setProfileSeller(selected.seller);
            setSelected(null);
          }}
        />
      )}
      {profileSeller && (
        <SellerProfileModal
          seller={profileSeller}
          fullName={
            users.find((user) => user.username === profileSeller)?.fullName ??
            systemListings.find((record) => record.listing.seller === profileSeller)
              ?.sellerFullName ??
            profileSeller
              .split(".")
              .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
              .join(" ")
          }
          users={users}
          reviews={sellerReviews.filter(
            (review) =>
              review.sellerUsername === profileSeller || review.listing.seller === profileSeller,
          )}
          listings={liveListings.filter((listing) => listing.seller === profileSeller)}
          sellerRatings={sellerRatings}
          onClose={() => setProfileSeller(null)}
          onOpenListing={(listing) => {
            setProfileSeller(null);
            setSelected(listing);
          }}
        />
      )}
      {toast && (
        <div className="toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}
