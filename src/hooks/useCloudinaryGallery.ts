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

// Cloudinary credentials (same values used in server.ts / api/gallery-list.ts)
const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || "dsqjg9mfg";
const API_KEY    = (import.meta.env.VITE_CLOUDINARY_API_KEY    as string) || "731583139833111";
const API_SECRET = (import.meta.env.VITE_CLOUDINARY_API_SECRET as string) || "5Kbu5rq0DcwEbqlWXTD58Mk4dOw";

// Build a Basic-auth header from the key:secret pair.
// btoa is available in all modern browsers and Node 16+.
function makeAuth() {
  return "Basic " + btoa(`${API_KEY}:${API_SECRET}`);
}

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  context?: { custom?: { category?: string; caption?: string } };
};

async function fetchCloudinaryItems(): Promise<Omit<GalleryItem, "id">[]> {
  const search = (resourceType: string) =>
    fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`, {
      method: "POST",
      headers: {
        Authorization: makeAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expression: `folder:ebsu_gallery AND resource_type:${resourceType}`,
        sort_by: [{ created_at: "desc" }],
        max_results: 500,
        with_field: ["context", "tags"],
      }),
    });

  const [imgRes, vidRes] = await Promise.all([search("image"), search("video")]);

  const mapResources = (
    resources: CloudinaryResource[],
    forcedType: "image" | "video"
  ): Omit<GalleryItem, "id">[] =>
    resources.map((r) => ({
      url:        r.secure_url,
      publicId:   r.public_id,
      category:   r.context?.custom?.category || "general",
      caption:    r.context?.custom?.caption  || "",
      type:       forcedType,
      uploadedAt: r.created_at,
      size:       r.bytes,
    }));

  const imgJson = imgRes.ok
    ? (await imgRes.json() as { resources?: CloudinaryResource[] })
    : { resources: [] };
  const vidJson = vidRes.ok
    ? (await vidRes.json() as { resources?: CloudinaryResource[] })
    : { resources: [] };

  return [
    ...mapResources(imgJson.resources || [], "image"),
    ...mapResources(vidJson.resources || [], "video"),
  ].sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
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

    fetchCloudinaryItems()
      .then((raw) => {
        if (cancelled) return;
        const mapped = raw.map((item, idx) => ({
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
      .catch((err) => {
        if (cancelled) return;
        console.error("[v0] Gallery fetch error:", err);
        // On any error, keep previously cached items visible
        const fallback = loadFromLocal();
        if (fallback.length > 0) {
          setItems(fallback);
        } else {
          setError((err as Error).message || "Failed to load gallery");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { items, loading, error, refetch: () => setTick((t) => t + 1) };
}
