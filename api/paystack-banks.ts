import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!SECRET) return res.status(500).json({ error: "Paystack secret key not configured" });

  try {
    const response = await fetch("https://api.paystack.co/bank?currency=NGN&perPage=100", {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const data = await response.json();
    if (!data.status) return res.status(500).json({ error: data.message || "Failed to fetch banks" });
    return res.status(200).json({ banks: data.data });
  } catch (error) {
    console.error("[paystack-banks] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
