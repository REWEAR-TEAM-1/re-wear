export const categories = [
  "TOPS",
  "BOTTOMS",
  "DRESSES",
  "OUTERWEAR",
  "ACCESSORIES",
] as const;

export const conditions = ["NEW", "LIKE_NEW", "GOOD", "REWORKABLE"] as const;
export const listingTypes = ["SALE", "REDESIGN"] as const;

export type ListingCategory = (typeof categories)[number];
export type ListingCondition = (typeof conditions)[number];
export type ListingType = (typeof listingTypes)[number];

export interface Listing {
  id: number;
  title: string;
  description: string;
  sellerName: string;
  category: ListingCategory;
  size: string;
  condition: ListingCondition;
  price: number;
  type: ListingType;
  imageUrl: string | null;
  location: string;
  createdAt: string;
}

export interface ListingDraft {
  title: string;
  description: string;
  sellerName: string;
  category: ListingCategory;
  size: string;
  condition: ListingCondition;
  price: number;
  type: ListingType;
  imageUrl: string;
  location: string;
}
