import { useState, useEffect } from "react";

export interface GalleryItem {
  id: string;
  url: string;
  publicId: string;
  type: "image" | "video";
  category: string;
  caption: string;
  uploadedAt: string;
  size?: number;
}

interface UseCloudinaryGalleryResult {
  items: GalleryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const LS_KEY = "ebsumsa_gallery_cache";

function saveToLocal(items: GalleryItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ items, at: Date.now() }));
  } catch { /* storage full or unavailable */ }
}

function loadFromLocal(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const { items } = JSON.parse(raw) as { items: GalleryItem[] };
    return Array.isArray(items) ? items : [];
  } catch { return []; }
}

export function useCloudinaryGallery(): UseCloudinaryGalleryResult {
  const [items, setItems] = useState<GalleryItem[]>(() => loadFromLocal());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Listen for localStorage changes from another tab (e.g. admin uploads)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue) {
        try {
          const { items: fresh } = JSON.parse(e.newValue) as { items: GalleryItem[] };
          if (Array.isArray(fresh) && fresh.length > 0) setItems(fresh);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const CLOUD_NAME =
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME) ||
      "dsqjg9mfg";

    /** Fetch directly from Cloudinary's unsigned resource listing (no secret needed) */
    const fetchFromCloudinaryDirect = async (): Promise<GalleryItem[]> => {
      // Cloudinary allows fetching resources in a folder via the "list" endpoint
      // when a "list" resource type tag is used, or via the upload preset folder name.
      // We use the /resources/image endpoint with a pre-generated list tag.
      const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/ebsu_gallery.json`;
      const res = await fetch(base);
      if (!res.ok) return [];
      const data = await res.json() as { resources?: { public_id: string; version: number; format: string }[] };
      return (data.resources || []).map((r, idx) => ({
        id:         r.public_id || String(idx),
        url:        `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${r.public_id}.${r.format}`,
        publicId:   r.public_id,
        type:       "image" as const,
        category:   "general",
        caption:    "",
        uploadedAt: new Date().toISOString(),
      }));
    };

    fetch("/api/gallery-list")
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data: { items: Omit<GalleryItem, "id">[] }) => {
        if (cancelled) return;
        const mapped = (data.items || []).map((item, idx) => ({
          ...item,
          id: item.publicId || String(idx),
        }));
        if (mapped.length > 0) {
          setItems(mapped);
          saveToLocal(mapped);
        } else {
          const fallback = loadFromLocal();
          if (fallback.length > 0) setItems(fallback);
        }
      })
      .catch(async (err) => {
        if (cancelled) return;
        // Proxy not available (e.g. dev sandbox) — try Cloudinary directly
        try {
          const direct = await fetchFromCloudinaryDirect();
          if (!cancelled && direct.length > 0) {
            setItems(direct);
            saveToLocal(direct);
            return;
          }
        } catch { /* ignore */ }
        // Fall back to localStorage cache
        const fallback = loadFromLocal();
        if (fallback.length > 0) {
          setItems(fallback);
        } else {
          setError(err.message || "Failed to load gallery");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { items, loading, error, refetch: () => setTick((t) => t + 1) };
}
