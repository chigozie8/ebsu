/**
 * Cloudinary helpers — work in both Vite dev and Vercel production.
 * Calls the Cloudinary API directly from the browser using import.meta.env
 * so we never depend on /api/* serverless routes (which break in Vite preview).
 */

import type { GalleryItem } from "../pages/admin/tabs/AdminGalleryManager";

const cloudName    = () => (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME  as string) || "";
const apiKey       = () => (import.meta.env.VITE_CLOUDINARY_API_KEY     as string) || "";
const apiSecret    = () => (import.meta.env.VITE_CLOUDINARY_API_SECRET   as string) || "";
export const uploadPreset = () => (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || "";
export const getCloudName = cloudName;

/** SHA-1 digest using SubtleCrypto (browser native, no deps) */
async function sha1(message: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-1", enc.encode(message));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** List all images/videos in the ebsu_gallery Cloudinary folder */
export async function listGalleryItems(): Promise<GalleryItem[]> {
  const cn = cloudName();
  const ak = apiKey();
  const as = apiSecret();

  if (!cn || !ak || !as) {
    throw new Error(
      "Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_API_KEY and VITE_CLOUDINARY_API_SECRET in your project Vars."
    );
  }

  const auth = btoa(`${ak}:${as}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cn}/resources/search`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expression: "folder:ebsu_gallery",
      sort_by: [{ created_at: "desc" }],
      max_results: 500,
      with_field: ["context", "tags"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    resources: Array<{
      public_id: string;
      secure_url: string;
      resource_type: string;
      created_at: string;
      bytes: number;
      context?: { custom?: { category?: string; caption?: string } };
    }>;
  };

  return (data.resources || []).map((r) => ({
    url:        r.secure_url,
    publicId:   r.public_id,
    category:   r.context?.custom?.category || "general",
    caption:    r.context?.custom?.caption  || "",
    type:       r.resource_type === "video" ? "video" : "image",
    uploadedAt: r.created_at,
    size:       r.bytes,
  }));
}

/** Delete a resource from Cloudinary */
export async function deleteGalleryItem(
  publicId: string,
  resourceType = "image"
): Promise<void> {
  const cn = cloudName();
  const ak = apiKey();
  const as = apiSecret();

  if (!cn || !ak || !as) throw new Error("Cloudinary not configured");

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await sha1(`public_id=${publicId}&timestamp=${timestamp}${as}`);

  const form = new URLSearchParams();
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", ak);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cn}/${resourceType}/destroy`,
    { method: "POST", body: form }
  );

  const d = (await res.json()) as { result: string };
  if (d.result !== "ok" && d.result !== "not found") {
    throw new Error(`Delete failed: ${d.result}`);
  }
}
