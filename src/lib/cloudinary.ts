/**
 * Cloudinary-only gallery helpers.
 *
 * - Upload  → direct browser → Cloudinary unsigned upload (CORS allowed)
 * - List    → direct browser → Cloudinary REST API (signed with API key + secret)
 * - Delete  → /api/gallery-upload DELETE (server-side, signed destroy)
 *
 * Calling Cloudinary directly avoids the need for the Express dev server on port 3001.
 * Works in both Vite dev preview and Vercel production.
 */

import type { GalleryItem } from "../pages/admin/tabs/AdminGalleryManager";

export const getCloudName   = () => (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   as string) || "dsqjg9mfg";
export const uploadPreset   = () => (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || "ebsumsa";

const getApiKey    = () => (import.meta.env.VITE_CLOUDINARY_API_KEY    as string) || "731583139833111";
const getApiSecret = () => (import.meta.env.VITE_CLOUDINARY_API_SECRET as string) || "5Kbu5rq0DcwEbqlWXTD58Mk4dOw";

// ─── List ────────────────────────────────────────────────────────────────────
export async function listGalleryItems(): Promise<GalleryItem[]> {
  const cloudName = getCloudName();
  const auth = "Basic " + btoa(`${getApiKey()}:${getApiSecret()}`);

  const searchOne = (resourceType: string) =>
    fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        expression: `folder:ebsu_gallery AND resource_type:${resourceType}`,
        sort_by: [{ created_at: "desc" }],
        max_results: 500,
        with_field: ["context", "tags"],
      }),
    });

  const [imgRes, vidRes] = await Promise.all([searchOne("image"), searchOne("video")]);

  type CloudRes = { public_id: string; secure_url: string; created_at: string; bytes: number; context?: { custom?: { category?: string; caption?: string } } };

  const mapResources = (resources: CloudRes[], forcedType: "image" | "video"): GalleryItem[] =>
    resources.map((r, idx) => ({
      id:         r.public_id || String(idx),
      url:        r.secure_url,
      publicId:   r.public_id,
      type:       forcedType,
      category:   r.context?.custom?.category || "general",
      caption:    r.context?.custom?.caption  || "",
      uploadedAt: r.created_at,
      size:       r.bytes,
    }));

  const imgJson = imgRes.ok ? (await imgRes.json() as { resources?: CloudRes[] }) : { resources: [] };
  const vidJson = vidRes.ok ? (await vidRes.json() as { resources?: CloudRes[] }) : { resources: [] };

  return [
    ...mapResources(imgJson.resources || [], "image"),
    ...mapResources(vidJson.resources || [], "video"),
  ].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

// ─── Delete ──────────────────────────────────────────────────────────────────
export async function deleteGalleryItem(
  publicId: string,
  resourceType = "image"
): Promise<void> {
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
    throw new Error("Delete failed — server returned invalid response.");
  }
  if (!res.ok || data.error) {
    throw new Error(data.error || `Delete failed (${res.status})`);
  }
}
