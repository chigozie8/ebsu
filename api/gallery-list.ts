import type { VercelRequest, VercelResponse } from "@vercel/node";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// The manifest is stored at a well-known public Vercel Blob URL.
// We derive its URL from the store's base URL (part of BLOB_READ_WRITE_TOKEN)
// or simply try to fetch it from the known public CDN path.
function getManifestUrl(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";
  // BLOB_READ_WRITE_TOKEN format: vercel_blob_rw_{storeId}_{secret}
  // Public base URL: https://{storeId}.public.blob.vercel-storage.com
  const match = token.match(/vercel_blob_rw_([A-Za-z0-9]+)_/);
  if (!match) return null;
  const storeId = match[1].toLowerCase();
  return `https://${storeId}.public.blob.vercel-storage.com/gallery-manifest.json`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const manifestUrl = getManifestUrl();

  if (!manifestUrl) {
    return res.status(200).json({ items: [], manifestUrl: null });
  }

  try {
    const r = await fetch(`${manifestUrl}?t=${Date.now()}`); // bust cache
    if (!r.ok) {
      // Manifest doesn't exist yet — gallery is empty
      return res.status(200).json({ items: [], manifestUrl });
    }
    const items = await r.json();
    return res.status(200).json({ items: Array.isArray(items) ? items : [], manifestUrl });
  } catch (err) {
    console.error("[gallery-list] error:", err);
    // Return empty instead of error — so gallery shows empty state not error
    return res.status(200).json({ items: [], manifestUrl });
  }
}
