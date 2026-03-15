import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: false } };

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/** Collect all chunks from the IncomingMessage into a single Buffer */
async function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Parse a multipart/form-data body manually using the boundary */
function parseMultipart(
  body: Buffer,
  boundary: string
): { fields: Record<string, string>; file?: { buffer: Buffer; filename: string; mimeType: string } } {
  const fields: Record<string, string> = {};
  let file: { buffer: Buffer; filename: string; mimeType: string } | undefined;

  const sep = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let start = 0;

  while (start < body.length) {
    const idx = body.indexOf(sep, start);
    if (idx === -1) break;
    const end = body.indexOf(sep, idx + sep.length);
    const chunk = end === -1 ? body.slice(idx + sep.length) : body.slice(idx + sep.length, end);
    parts.push(chunk);
    start = end === -1 ? body.length : end;
  }

  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const headerStr = part.slice(0, headerEnd).toString();
    const body = part.slice(headerEnd + 4);
    // Strip trailing \r\n--
    const data = body.slice(0, body.lastIndexOf("\r\n"));

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const mimeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

    if (!nameMatch) continue;
    const name = nameMatch[1];

    if (filenameMatch) {
      file = {
        buffer: data,
        filename: filenameMatch[1],
        mimeType: mimeMatch ? mimeMatch[1].trim() : "application/octet-stream",
      };
    } else {
      fields[name] = data.toString().trim();
    }
  }

  return { fields, file };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const contentType = req.headers["content-type"] || "";
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) return res.status(400).json({ error: "Missing multipart boundary" });

    const body = await readBody(req);
    const { fields, file } = parseMultipart(body, boundaryMatch[1].trim());

    if (!file) return res.status(400).json({ error: "No file provided" });

    const caption  = fields.caption  || "";
    const category = fields.category || "general";
    const isVideo  = file.mimeType.startsWith("video/");
    const ext      = file.filename.split(".").pop() || (isVideo ? "mp4" : "jpg");
    const pathname = `gallery/${category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(pathname, file.buffer, {
      access: "public",
      contentType: file.mimeType,
      addRandomSuffix: false,
    });

    return res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
      caption,
      category,
      type: isVideo ? "video" : "image",
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[gallery-upload]", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}

