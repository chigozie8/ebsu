/**
 * Cloudinary + Firestore gallery helpers.
 *
 * Strategy (CORS-safe, works in Vite dev & Vercel production):
 *  - Upload  → Cloudinary unsigned upload endpoint (no secret needed, CORS allowed)
 *  - List    → Firebase Firestore "gallery" collection (no CORS issues)
 *  - Delete  → Cloudinary destroy via /api/gallery-upload serverless fn (server-side secret)
 *              Falls back to just removing from Firestore if the API is unavailable.
 *
 * This completely avoids calling the Cloudinary Admin/Search API from the browser,
 * which blocks due to CORS when using Basic Auth.
 */

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { GalleryItem } from "../pages/admin/tabs/AdminGalleryManager";

const COLLECTION = "gallery";

export const getCloudName   = () => (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   as string) || "";
export const uploadPreset   = () => (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || "";

// ─── List ────────────────────────────────────────────────────────────────────
/** Fetch all gallery items from Firestore, newest first. */
export async function listGalleryItems(): Promise<GalleryItem[]> {
  const q = query(collection(db, COLLECTION), orderBy("uploadedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      url:        data.url        as string,
      publicId:   data.publicId   as string,
      category:   data.category   as string,
      caption:    (data.caption   as string) || "",
      type:       (data.type      as "image" | "video") || "image",
      uploadedAt: data.uploadedAt?.toDate?.()?.toISOString?.() ?? (data.uploadedAt as string) ?? "",
      size:       (data.size      as number) | 0,
      firestoreId: d.id,
    } as GalleryItem & { firestoreId: string };
  });
}

// ─── Save to Firestore after upload ──────────────────────────────────────────
/** Persist a newly uploaded item to Firestore. */
export async function saveGalleryItem(
  item: Omit<GalleryItem, "uploadedAt">
): Promise<GalleryItem> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...item,
    uploadedAt: serverTimestamp(),
  });
  return {
    ...item,
    uploadedAt: new Date().toISOString(),
  } as GalleryItem & { firestoreId: string; } & { firestoreId: string };
  void ref; // ref id not needed but saved in Firestore
}

// ─── Delete ──────────────────────────────────────────────────────────────────
/**
 * Delete a gallery item:
 *  1. Remove from Firestore by matching publicId.
 *  2. Attempt to destroy on Cloudinary via the serverless route (best-effort).
 */
export async function deleteGalleryItem(
  publicId: string,
  resourceType = "image"
): Promise<void> {
  // 1. Remove from Firestore
  const q = query(collection(db, COLLECTION));
  const snap = await getDocs(q);
  const docToDelete = snap.docs.find((d) => d.data().publicId === publicId);
  if (docToDelete) {
    await deleteDoc(doc(db, COLLECTION, docToDelete.id));
  }

  // 2. Best-effort: call serverless route to destroy from Cloudinary CDN
  try {
    await fetch("/api/gallery-upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId, resourceType }),
    });
  } catch {
    // Silently ignore — item is already removed from Firestore
  }
}
