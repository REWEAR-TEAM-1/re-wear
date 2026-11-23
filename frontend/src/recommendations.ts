import type { Listing, ListingCategory } from "./types";

export interface MatchPreferences {
  category: ListingCategory | "";
  size: string;
}

export function matchScore(listing: Listing, preferences: MatchPreferences): number {
  let score = 0;
  if (preferences.category && listing.category === preferences.category) score += 2;
  if (preferences.size && listing.size.toLowerCase() === preferences.size.toLowerCase()) score += 2;
  if (preferences.size && listing.size.toLowerCase() === "custom") score += 1;
  return score;
}

export function recommendListings(
  listings: Listing[],
  preferences: MatchPreferences,
): Listing[] {
  return [...listings]
    .map((listing) => ({ listing, score: matchScore(listing, preferences) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.listing.id - a.listing.id)
    .map(({ listing }) => listing);
}
