import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveImageUrl, uploadImage } from "./api";

describe("image uploads", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves stored upload paths and leaves external images unchanged", () => {
    expect(resolveImageUrl("/uploads/photo.png")).toBe("/uploads/photo.png");
    expect(resolveImageUrl("https://images.example/photo.png")).toBe("https://images.example/photo.png");
    expect(resolveImageUrl(null)).toBeNull();
  });

  it("sends the selected file as multipart data and returns its stored URL", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ imageUrl: "/uploads/photo.png" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const file = new File(["photo"], "closet photo.png", { type: "image/png" });

    await expect(uploadImage(file)).resolves.toBe("/uploads/photo.png");

    const [, options] = fetchMock.mock.calls[0];
    expect(options?.method).toBe("POST");
    expect(options?.body).toBeInstanceOf(FormData);
    const body = options?.body;
    if (!(body instanceof FormData)) {
      throw new Error("Image uploads must use multipart form data.");
    }
    expect(body.get("file")).toBe(file);
    expect(options?.headers).toBeUndefined();
  });

  it("surfaces API errors when an image cannot be uploaded", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Upload a JPG, PNG, GIF, or WEBP image.", { status: 400 }),
    );

    await expect(uploadImage(new File(["not an image"], "photo.svg", { type: "image/svg+xml" })))
      .rejects.toThrow("Upload a JPG, PNG, GIF, or WEBP image.");
  });
});
