/**
 * Shared fetcher functions with a simple in-memory module-level cache.
 * Data is fetched once per session and reused — no SWR or extra dependency needed.
 * All fetchers use getDocs (one-shot) instead of onSnapshot (real-time listener)
 * so there are no persistent socket connections draining performance.
 */

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase";
import { IBlogPost } from "../models/misc/blog/blogPosts";
import { localBlogPosts } from "../data/misc/blog/posts";

// ---- Simple module-level cache ---------------------------------------------
// Lives for the lifetime of the browser session (until hard refresh).
// Same behaviour as SWR with revalidateOnFocus: false.

const cache = new Map<string, unknown>();

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (cache.has(key)) return cache.get(key) as T;
  const result = await fetcher();
  cache.set(key, result);
  return result;
}

// ---- Gallery ---------------------------------------------------------------

export interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  createdAt?: number;
}

export const fetchGalleryItems = (): Promise<GalleryItem[]> =>
  cachedFetch("galleryImages", async () => {
    if (!isFirebaseConfigured) return [];
    const q = query(collection(db, "galleryImages"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, "id">) }));
  });

// ---- Blog posts ------------------------------------------------------------

const mergeWithLocalPosts = (firebasePosts: IBlogPost[]): IBlogPost[] => {
  const firebaseNos = new Set(firebasePosts.map((p) => p.no));
  const filtered = localBlogPosts.filter((p) => !firebaseNos.has(p.no));
  return [...firebasePosts, ...(filtered as IBlogPost[])];
};

export const fetchBlogPostsOnce = (): Promise<IBlogPost[]> =>
  cachedFetch("blogPosts", async () => {
    if (!isFirebaseConfigured) return localBlogPosts as IBlogPost[];
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
  });

/** Call this after admin writes to force a fresh fetch next time */
export const invalidateCache = (key: string) => cache.delete(key);
