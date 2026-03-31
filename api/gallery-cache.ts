import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  // Vercel functions are stateless — no persistent cache to update.
  // Each gallery-list invocation fetches fresh data from Cloudinary already.
  // Return success so the client-side cache-bust call doesn't fail.
  const { publicId } = (req.body || {}) as { publicId?: string };
  if (publicId) {
    return res.status(200).json({ cleared: false, removed: publicId });
  }
  return res.status(200).json({ cleared: true });
}
