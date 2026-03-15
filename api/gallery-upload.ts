import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: false } };

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/** Read the entire request body into a Buffer */
function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

interface ParsedPart {
  name: string;
  filename?: string;
  mimeType?: string;
  data: Buffer;
}

/**
 * Robust multipart/form-data parser.
 * Handles CRLF (\r\n) and LF-only (\n) line endings.
 */
function parseMultipart(body: Buffer, boundary: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const CRLF = Buffer.from("\r\n");
  const boundaryBuf = Buffer.from("--" + boundary);
  const endBoundaryBuf = Buffer.from("--" + boundary + "--");

  let offset = 0;

  const indexOf = (haystack: Buffer, needle: Buffer, start: number): number => {
    for (let i = start; i <= haystack.length - needle.length; i++) {
      if (haystack.slice(i, i + needle.length).equals(needle)) return i;
    }
    return -1;
  };

  while (offset < body.length) {
    // Find boundary
    const boundaryIdx = indexOf(body, boundaryBuf, offset);
    if (boundaryIdx === -1) break;

    // Skip past boundary + CRLF
    let pos = boundaryIdx + boundaryBuf.length;

    // Check if end boundary
    if (body.slice(pos, pos + 2).toString() === "--") break;

    // Skip CRLF after boundary
    if (body.slice(pos, pos + 2).toString() === "\r\n") pos += 2;
    else if (body[pos] === 0x0a) pos += 1; // LF only

    // Parse headers until empty line
    const headerLines: string[] = [];
    while (pos < body.length) {
      const lineEnd = indexOf(body, CRLF, pos);
      if (lineEnd === -1 || lineEnd === pos) {
        // Empty line = end of headers
        pos = lineEnd === pos ? pos + 2 : body.length;
        break;
      }
      headerLines.push(body.slice(pos, lineEnd).toString());
      pos = lineEnd + 2;
    }

    // Find next boundary (data ends just before it)
    const nextBoundaryIdx = indexOf(body, boundaryBuf, pos);
    if (nextBoundaryIdx === -1) break;

    // Data is between pos and (nextBoundaryIdx - CRLF)
    let dataEnd = nextBoundaryIdx;
    // Strip trailing CRLF before boundary
    if (dataEnd >= 2 && body.slice(dataEnd - 2, dataEnd).toString() === "\r\n") {
      dataEnd -= 2;
    } else if (dataEnd >= 1 && body[dataEnd - 1] === 0x0a) {
      dataEnd -= 1;
    }

    const data = body.slice(pos, dataEnd);
    offset = nextBoundaryIdx;

    // Parse Content-Disposition
    const dispHeader = headerLines.find((l) => /content-disposition/i.test(l)) || "";
    const ctHeader   = headerLines.find((l) => /content-type/i.test(l))        || "";

    const nameMatch     = dispHeader.match(/name="([^"]+)"/i);
    const filenameMatch = dispHeader.match(/filename="([^"]+)"/i);
    const mimeMatch     = ctHeader.match(/:\s*(.+)/);

    if (!nameMatch) continue;

    parts.push({
      name:     nameMatch[1],
      filename: filenameMatch?.[1],
      mimeType: mimeMatch ? mimeMatch[1].trim().split(";")[0].trim() : undefined,
      data,
    });
  }

  return parts;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const contentType = (req.headers["content-type"] || "").toString();
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Expected multipart/form-data" });
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: "Missing multipart boundary" });
    }
    const boundary = (boundaryMatch[1] || boundaryMatch[2]).trim();

    const body  = await readBody(req);
    const parts = parseMultipart(body, boundary);

    console.log("[gallery-upload] parsed parts:", parts.map((p) => ({ name: p.name, filename: p.filename, mime: p.mimeType, size: p.data.length })));

    const filePart    = parts.find((p) => p.filename);
    const captionPart = parts.find((p) => p.name === "caption");
    const catPart     = parts.find((p) => p.name === "category");

    if (!filePart || filePart.data.length === 0) {
      console.error("[gallery-upload] no file part found in:", parts.map((p) => p.name));
      return res.status(400).json({ error: "No file found in upload" });
    }

    const caption  = captionPart  ? captionPart.data.toString().trim()  : "";
    const category = catPart      ? catPart.data.toString().trim()      : "general";
    const mimeType = filePart.mimeType || "application/octet-stream";
    const isVideo  = mimeType.startsWith("video/");
    const rawExt   = (filePart.filename || "file").split(".").pop() || (isVideo ? "mp4" : "jpg");
    const ext      = rawExt.toLowerCase();
    const safeFilename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const blobPath = `gallery/${category}/${safeFilename}`;

    console.log("[gallery-upload] uploading to blob:", blobPath, "size:", filePart.data.length, "mime:", mimeType);

    const blob = await put(blobPath, filePart.data, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });

    console.log("[gallery-upload] success:", blob.url);

    return res.status(200).json({
      url:        blob.url,
      pathname:   blob.pathname,
      caption,
      category,
      type:       isVideo ? "video" : "image",
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[gallery-upload] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message || "Upload failed" });
  }
}
