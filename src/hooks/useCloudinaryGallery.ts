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

export function useCloudinaryGallery(): UseCloudinaryGalleryResult {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

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
        setItems(mapped);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load gallery");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { items, loading, error, refetch: () => setTick((t) => t + 1) };
}
