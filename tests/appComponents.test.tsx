import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Icon, ListingCard, ListingPhoto, Logo, StarMeter } from "../src/App";
import type { Listing } from "../src/lib/api";

const listing: Listing = {
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
  description: "A desk lamp",
};

describe("App presentational components", () => {
  test("Icon applies the requested size and renders its shape", () => {
    const markup = renderToStaticMarkup(createElement(Icon, { name: "grid", size: 24 }));
    expect(markup).toContain('width="24"');
    expect(markup).toContain("<rect");
    expect(markup).toContain('aria-hidden="true"');
  });

  test("StarMeter clamps and rounds its filled stars", () => {
    const markup = renderToStaticMarkup(createElement(StarMeter, { value: 3.6 }));
    expect(markup).toContain('aria-label="3.6 out of 5 stars"');
    expect(markup.match(/class="is-filled"/g)).toHaveLength(4);
    expect(markup.match(/class="is-empty"/g)).toHaveLength(1);
  });

  test("Logo renders the marketplace lockup", () => {
    const markup = renderToStaticMarkup(createElement(Logo));
    expect(markup).toContain("HKUST");
    expect(markup).toContain("MARKETPLACE");
  });

  test("ListingPhoto renders an image or the empty preview state", () => {
    const imageMarkup = renderToStaticMarkup(
      createElement(ListingPhoto, { src: listing.image, alt: listing.title }),
    );
    const emptyMarkup = renderToStaticMarkup(
      createElement(ListingPhoto, { src: "data:image/svg+xml;base64,abc", alt: listing.title }),
    );
    expect(imageMarkup).toContain('src="https://example.com/lamp.jpg"');
    expect(emptyMarkup).toContain("No preview available.");
  });

  test("ListingCard presents key listing details", () => {
    const markup = renderToStaticMarkup(createElement(ListingCard, { listing, onOpen: () => {} }));
    expect(markup).toContain("Desk lamp");
    expect(markup).toContain("@alice");
    expect(markup).toContain("HK$250");
  });
});
