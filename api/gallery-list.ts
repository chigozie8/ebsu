import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: "Cloudinary env vars not configured" });
  }

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
      {
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
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: `Cloudinary: ${text.slice(0, 200)}` });
    }

    const data = await response.json() as {
      resources: Array<{
        public_id: string;
        secure_url: string;
        resource_type: string;
        created_at: string;
        bytes: number;
        context?: { custom?: { category?: string; caption?: string } };
      }>;
    };

    const items = (data.resources || []).map((r) => ({
      url:        r.secure_url,
      publicId:   r.public_id,
      category:   r.context?.custom?.category || "general",
      caption:    r.context?.custom?.caption  || "",
      type:       r.resource_type === "video" ? "video" : "image",
      uploadedAt: r.created_at,
      size:       r.bytes,
    }));

    return res.status(200).json({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}

