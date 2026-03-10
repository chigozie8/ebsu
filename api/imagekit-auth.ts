import type { VercelRequest, VercelResponse } from "@vercel/node";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT || "",
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const authenticationParameters = imagekit.getAuthenticationParameters();
  return res.status(200).json(authenticationParameters);
}
