import type { Listing, ListingDraft } from "./types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthSession {
  authenticated: boolean;
  user: AuthUser | null;
}

interface CsrfResponse {
  token: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) {
    return null;
  }
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }
  return `${apiBaseUrl}${imageUrl}`;
}

async function csrfToken(): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/api/auth/csrf`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Could not start a secure session.");
  }
  const result: CsrfResponse = await response.json();
  return result.token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-XSRF-TOKEN", await csrfToken());
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await request<AuthSession>("/api/auth/me");
  return session.authenticated ? session.user : null;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const session = await request<AuthSession>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!session.user) {
    throw new ApiError(401, "The sign-in response did not include an account.");
  }
  return session.user;
}

export async function signUp(name: string, email: string, password: string): Promise<AuthUser> {
  const session = await request<AuthSession>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (!session.user) {
    throw new ApiError(500, "The sign-up response did not include an account.");
  }
  return session.user;
}

export async function signOut(): Promise<void> {
  await request<void>("/api/auth/signout", { method: "POST" });
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
    credentials: "include",
    headers: {
      "X-XSRF-TOKEN": await csrfToken(),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body || `Image upload failed with status ${response.status}`);
  }

  const result: { imageUrl: string } = await response.json();
  return result.imageUrl;
}
