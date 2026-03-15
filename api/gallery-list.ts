import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list } from "@vercel/blob";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // List ALL blobs in the store (no prefix filter) and paginate through all pages
    const allBlobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
    let cursor: string | undefined;

    do {
      const result = await list({ limit: 1000, cursor });
      allBlobs.push(...result.blobs);
      cursor = result.cursor;
    } while (cursor);

    console.log("[gallery-list] total blobs in store:", allBlobs.length);
    console.log("[gallery-list] all pathnames:", allBlobs.map((b) => b.pathname).join(", "));

    // Only keep blobs under the gallery/ prefix
    const galleryBlobs = allBlobs.filter((b) => b.pathname.startsWith("gallery/"));

    console.log("[gallery-list] gallery blobs found:", galleryBlobs.length);

    const items = galleryBlobs.map((blob) => {
      const parts = blob.pathname.split("/");
      // pathname: gallery/{category}/{filename}
      const category = parts.length >= 3 ? parts[1] : "general";
      const filename = parts[parts.length - 1];
      const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(filename);

      return {
        url: blob.url,
        pathname: blob.pathname,
        category,
        type: isVideo ? "video" : "image",
        uploadedAt: blob.uploadedAt,
        size: blob.size,
        caption: "",
      };
    });

    // Sort newest first
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return res.status(200).json({ items });
  } catch (err) {
    console.error("[gallery-list]", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Failed to list gallery items" });
  }
}
