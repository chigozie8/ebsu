import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  // Vercel functions are stateless — no file cache to clear.
  // Simply return success; the next gallery-list request fetches fresh data.
  return res.status(200).json({ cleared: true });
}
