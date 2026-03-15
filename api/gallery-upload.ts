import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const form = formidable({ maxFileSize: 100 * 1024 * 1024 });

    const { fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const fileArray = files.file;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    if (!file) return res.status(400).json({ error: "No file provided" });

    const caption = Array.isArray(fields.caption) ? fields.caption[0] : fields.caption ?? "";
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category ?? "general";
    const mimeType = file.mimetype || "application/octet-stream";
    const isVideo = mimeType.startsWith("video/");
    const ext = isVideo ? (file.originalFilename?.split(".").pop() || "mp4") : "jpg";
    const pathname = `gallery/${category}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const fileBuffer = fs.readFileSync(file.filepath);

    const blob = await put(pathname, fileBuffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });

    fs.unlinkSync(file.filepath);

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
