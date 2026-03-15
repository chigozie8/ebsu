import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";

// We use Vercel's native body as a Buffer — bodyParser must be OFF
export const config = { api: { bodyParser: false } };

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Category, X-Caption, X-Filename");
}

function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = [];
    req.on("data", (c: Buffer) => parts.push(c));
    req.on("end", () => resolve(Buffer.concat(parts)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  try {
    // Accept the raw file bytes in the body + metadata via custom headers
    const category  = ((req.headers["x-category"]  as string) || "general").trim();
    const caption   = ((req.headers["x-caption"]   as string) || "").trim();
    const filename  = ((req.headers["x-filename"]  as string) || "file.jpg").trim();
    const mimeType  = ((req.headers["content-type"] as string) || "image/jpeg").split(";")[0].trim();

    console.log("[gallery-upload] incoming:", { category, caption, filename, mimeType });

    const body = await readBody(req);
    console.log("[gallery-upload] body bytes:", body.length);

    if (body.length === 0) {
      return res.status(400).json({ error: "Empty file body" });
    }

    const isVideo  = mimeType.startsWith("video/");
    const ext      = filename.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
    const blobPath = `gallery/${category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(blobPath, body, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });

    console.log("[gallery-upload] uploaded to:", blob.url);

    return res.status(200).json({
      url:        blob.url,
      pathname:   blob.pathname,
      caption,
      category,
      type:       isVideo ? "video" : "image",
      uploadedAt: new Date().toISOString(),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[gallery-upload] error:", msg);
    return res.status(500).json({ error: msg });
  }
}
