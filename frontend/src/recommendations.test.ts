import { describe, expect, it } from "vitest";
import { matchScore, recommendListings } from "./recommendations";
import type { Listing } from "./types";

const listing = (id: number, category: Listing["category"], size: string): Listing => ({
  id,
  title: `Piece ${id}`,
  description: "",
  sellerName: "Seller",
  category,
  size,
  condition: "GOOD",
  price: 18000,
  type: "SALE",
  imageUrl: null,
  location: "Seoul",
  createdAt: "",
});

describe("listing recommendations", () => {
  it("ranks listings matching both category and size ahead of partial matches", () => {
    const exact = listing(1, "TOPS", "M");
    const categoryOnly = listing(2, "TOPS", "S");
    const sizeOnly = listing(3, "DRESSES", "M");

    expect(recommendListings([categoryOnly, sizeOnly, exact], { category: "TOPS", size: "M" }))
      .toEqual([exact, sizeOnly, categoryOnly]);
  });

  it("treats a custom-sized redesign as a partial fit for the requested size", () => {
    const custom = listing(1, "OUTERWEAR", "Custom");

    expect(matchScore(custom, { category: "", size: "L" })).toBe(1);
    expect(recommendListings([custom], { category: "", size: "L" })).toEqual([custom]);
  });

  it("returns no suggestions when neither preference matches", () => {
    expect(recommendListings([listing(1, "TOPS", "S")], { category: "DRESSES", size: "M" }))
      .toEqual([]);
  });
});
