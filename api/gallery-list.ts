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
    const { blobs } = await list({ prefix: "gallery/", limit: 1000 });

    const items = blobs.map((blob) => {
      const parts = blob.pathname.split("/");
      // pathname: gallery/{category}/{filename}
      const category = parts.length >= 3 ? parts[1] : "general";
      const filename = parts[parts.length - 1];
      const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(filename);

      // caption is encoded in the content-type metadata — we use URL search params instead
      // For now caption defaults to empty; metadata is stored in the blob token
      return {
        url: blob.url,
        pathname: blob.pathname,
        category,
        type: isVideo ? "video" : "image",
        uploadedAt: blob.uploadedAt,
        size: blob.size,
      };
    });

    // Sort newest first
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return res.status(200).json({ items });
  } catch (err) {
    console.error("[gallery-list]", err);
    return res.status(500).json({ error: "Failed to list gallery items" });
  }
}
