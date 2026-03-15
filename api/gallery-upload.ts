import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

// This endpoint handles DELETE only.
// Uploads go directly from the browser to Cloudinary (no server needed).

function readBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = [];
    req.on("data", (c: Buffer) => parts.push(c));
    req.on("end", () => resolve(Buffer.concat(parts).toString()));
    req.on("error", reject);
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: "Cloudinary env vars not configured" });
  }

  try {
    const body = await readBody(req);
    const { publicId, resourceType = "image" } = JSON.parse(body) as { publicId: string; resourceType?: string };
    if (!publicId) return res.status(400).json({ error: "publicId required" });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const form = new URLSearchParams();
    form.append("public_id",  publicId);
    form.append("timestamp",  String(timestamp));
    form.append("api_key",    apiKey);
    form.append("signature",  signature);

    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      { method: "POST", body: form }
    );

    const data = await r.json() as { result: string };
    if (data.result !== "ok" && data.result !== "not found") {
      return res.status(500).json({ error: `Cloudinary delete failed: ${data.result}` });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}


export const config = { api: { bodyParser: false } };

const MANIFEST_PATH = "gallery-manifest.json";

interface ManifestItem {
  url: string;
  pathname: string;
  category: string;
  type: "image" | "video";
  caption: string;
  uploadedAt: string;
  size: number;
}

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Category, X-Caption, X-Filename, X-Action, X-Delete-Url");
}

function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = [];
    req.on("data", (c: Buffer) => parts.push(c));
    req.on("end", () => resolve(Buffer.concat(parts)));
    req.on("error", reject);
  });
}

async function loadManifest(manifestUrl: string | null): Promise<ManifestItem[]> {
  if (!manifestUrl) return [];
  try {
    // Fetch the public manifest JSON directly via HTTP
    const r = await fetch(manifestUrl);
    if (!r.ok) return [];
    return await r.json() as ManifestItem[];
  } catch {
    return [];
  }
}

async function saveManifest(items: ManifestItem[], token: string): Promise<string> {
  const blob = await put(MANIFEST_PATH, JSON.stringify(items), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });
  return blob.url;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  // ── DELETE: remove an item from manifest ──────────────────────────────────
  if (req.method === "DELETE") {
    try {
      const body = await readBody(req);
      const { url, manifestUrl } = JSON.parse(body.toString()) as { url: string; manifestUrl: string };
      if (!url) return res.status(400).json({ error: "No URL provided" });

      await del(url, { token });

      const items = await loadManifest(manifestUrl);
      const updated = items.filter((i) => i.url !== url);
      const newManifestUrl = await saveManifest(updated, token);

      return res.status(200).json({ success: true, manifestUrl: newManifestUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[gallery] delete error:", msg);
      return res.status(500).json({ error: msg });
    }
  }

  // ── POST: upload a new image ───────────────────────────────────────────────
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const category  = ((req.headers["x-category"]  as string) || "general").trim();
    const caption   = ((req.headers["x-caption"]   as string) || "").trim();
    const filename  = ((req.headers["x-filename"]  as string) || "file.jpg").trim();
    const mimeType  = ((req.headers["content-type"] as string) || "image/jpeg").split(";")[0].trim();
    const manifestUrl = ((req.headers["x-manifest-url"] as string) || "").trim() || null;

    const body = await readBody(req);
    if (body.length === 0) return res.status(400).json({ error: "Empty file body" });

    const isVideo  = mimeType.startsWith("video/");
    const ext      = filename.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
    const blobPath = `gallery/${category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload the actual file
    const blob = await put(blobPath, body, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
      token,
    });

    // Load existing manifest, add new item, save
    const manifest = await loadManifest(manifestUrl);
    const newItem: ManifestItem = {
      url:        blob.url,
      pathname:   blob.pathname,
      category,
      type:       isVideo ? "video" : "image",
      caption,
      uploadedAt: new Date().toISOString(),
      size:       body.length,
    };
    manifest.unshift(newItem);
    const newManifestUrl = await saveManifest(manifest, token);

    return res.status(200).json({ item: newItem, manifestUrl: newManifestUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[gallery-upload] error:", msg);
    return res.status(500).json({ error: msg });
  }
}
