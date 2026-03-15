/**
 * Shared SWR fetcher functions for Firestore data.
 * These are plain async functions — SWR handles caching, deduplication, and
 * stale-while-revalidate automatically. All fetchers use getDocs (one-shot)
 * instead of onSnapshot (real-time listener) so there are no persistent
 * socket connections draining performance on every page visit.
 */

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase";
import { IBlogPost } from "../models/misc/blog/blogPosts";
import { localBlogPosts } from "../data/misc/blog/posts";

// ---- Gallery ---------------------------------------------------------------

export interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  createdAt?: number;
}

export const fetchGalleryItems = async (): Promise<GalleryItem[]> => {
  if (!isFirebaseConfigured) return [];
  const q = query(collection(db, "galleryImages"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, "id">) }));
};

// ---- Blog posts ------------------------------------------------------------

const mergeWithLocalPosts = (firebasePosts: IBlogPost[]): IBlogPost[] => {
  const firebaseNos = new Set(firebasePosts.map((p) => p.no));
  const filtered = localBlogPosts.filter((p) => !firebaseNos.has(p.no));
  return [...firebasePosts, ...(filtered as IBlogPost[])];
};

export const fetchBlogPostsOnce = async (): Promise<IBlogPost[]> => {
  if (!isFirebaseConfigured) {
    return localBlogPosts as IBlogPost[];
  }
  try {
    const snap = await getDocs(collection(db, "blogPosts"));
    const firebasePosts: IBlogPost[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.contents && Array.isArray(data.contents)) {
        firebasePosts.push({ ...data, id: d.id } as IBlogPost);
      }
    });
    return mergeWithLocalPosts(firebasePosts).sort((a, b) => b.no - a.no);
  } catch {
    return localBlogPosts as IBlogPost[];
  }
};
