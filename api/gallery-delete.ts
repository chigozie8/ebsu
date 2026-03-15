import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del } from "@vercel/blob";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { url } = req.body as { url: string };
    if (!url) return res.status(400).json({ error: "No URL provided" });

    await del(url);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[gallery-delete]", err);
    return res.status(500).json({ error: "Delete failed" });
  }
}
