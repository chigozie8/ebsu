/**
 * Cloudinary-only gallery helpers.
 *
 * - Upload  → direct browser → Cloudinary unsigned upload (CORS allowed)
 * - List    → direct browser → Cloudinary Search API (delivery URL, no secret)
 * - Delete  → /api/gallery-upload DELETE (server-side, signed destroy) in prod
 *             In dev preview, silently succeeds (no local API server available)
 *
 * No Firestore involved. Works in both Vite dev and Vercel production.
 */

import type { GalleryItem } from "../pages/admin/tabs/AdminGalleryManager";

export const getCloudName   = () => (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   as string) || "dsqjg9mfg";
export const uploadPreset   = () => (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || "ebsumsa";

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  context?: { custom?: { category?: string; caption?: string } };
};

// ─── List ────────────────────────────────────────────────────────────────────
// Fetches directly from Cloudinary's delivery-based search URL — no API secret
// required, safe to call from the browser.
async function fetchResourceType(
  cloudName: string,
  resourceType: "image" | "video"
): Promise<GalleryItem[]> {
  const url = `https://res.cloudinary.com/${cloudName}/search/${resourceType}/folder:ebsu_gallery/sort_by[created_at]=desc/max_results:500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cloudinary ${resourceType} fetch failed (${res.status})`);
  const data = await res.json() as { resources?: CloudinaryResource[] };
  return (data.resources || []).map((r) => ({
    url:        r.secure_url,
    publicId:   r.public_id,
    category:   r.context?.custom?.category  || "general",
    caption:    r.context?.custom?.caption   || "",
    type:       resourceType,
    uploadedAt: r.created_at,
    size:       r.bytes,
  }));
}

export async function listGalleryItems(): Promise<GalleryItem[]> {
  const cloudName = getCloudName();
  const [images, videos] = await Promise.all([
    fetchResourceType(cloudName, "image"),
    fetchResourceType(cloudName, "video"),
  ]);
  return [...images, ...videos].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

// ─── Delete ──────────────────────────────────────────────────────────────────
// In production (Vercel) the /api/gallery-upload route is available.
// In dev preview there is no API server, so we skip the server call and rely on
// the caller's local state update + localStorage to remove the item visually.
export async function deleteGalleryItem(
  publicId: string,
  resourceType = "image"
): Promise<void> {
  try {
    const res = await fetch("/api/gallery-upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId, resourceType }),
    });
    const text = await res.text();
    let data: { success?: boolean; error?: string };
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response likely means the dev proxy is unavailable — swallow silently
      return;
    }
    if (!res.ok || data.error) {
      throw new Error(data.error || `Delete failed (${res.status})`);
    }
  } catch (err) {
    // If this is a network error (proxy not running in dev), swallow it so the
    // UI can still update its local state. In production the route will be available.
    if (err instanceof TypeError && err.message.includes("fetch")) return;
    throw err;
  }
}

