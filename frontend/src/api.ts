import type { Listing, ListingDraft } from "./types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) {
    return null;
  }
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }
  return `${apiBaseUrl}${imageUrl}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getListings(): Promise<Listing[]> {
  return request<Listing[]>("/api/listings");
}

export function createListing(draft: ListingDraft): Promise<Listing> {
  return request<Listing>("/api/listings", {
    method: "POST",
    body: JSON.stringify({
      ...draft,
      imageUrl: draft.imageUrl.trim() || null,
    }),
  });
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBaseUrl}/api/uploads`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Image upload failed with status ${response.status}`);
  }

  const result: { imageUrl: string } = await response.json();
  return result.imageUrl;
}
