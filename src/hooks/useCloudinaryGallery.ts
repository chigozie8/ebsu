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

    const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || "dsqjg9mfg";
    const apiKey    = (import.meta as any).env?.VITE_CLOUDINARY_API_KEY    || "731583139833111";
    const apiSecret = (import.meta as any).env?.VITE_CLOUDINARY_API_SECRET || "";

    // Call Cloudinary Search API directly from the browser using Basic auth
    const auth = btoa(`${apiKey}:${apiSecret}`);

    const searchPayload = (resourceType: string) =>
      fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expression: `folder:ebsu_gallery AND resource_type:${resourceType}`,
          sort_by: [{ created_at: "desc" }],
          max_results: 500,
          with_field: ["context", "tags"],
        }),
      });

    const mapResources = (data: any, forcedType: "image" | "video"): Omit<GalleryItem, "id">[] =>
      (data.resources || []).map((item: any) => ({
        url: item.secure_url,
        publicId: item.public_id,
        category: item.context?.custom?.category || "general",
        caption: item.context?.custom?.caption || "",
        type: forcedType,
        uploadedAt: item.created_at,
        size: item.bytes,
      }));

    Promise.all([searchPayload("image"), searchPayload("video")])
      .then(async ([imgRes, vidRes]) => {
        const imgData = imgRes.ok ? await imgRes.json() : { resources: [] };
        const vidData = vidRes.ok ? await vidRes.json() : { resources: [] };

        const combined = [
          ...mapResources(imgData, "image"),
          ...mapResources(vidData, "video"),
        ].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

        const mapped = combined.map((item, idx) => ({
          ...item,
          id: item.publicId || String(idx),
        }));

        if (cancelled) return;
        if (mapped.length > 0) {
          setItems(mapped);
          saveToLocal(mapped);
        } else {
          const fallback = loadFromLocal();
          if (fallback.length > 0) setItems(fallback);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // On any network error, keep the previously cached items visible
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
