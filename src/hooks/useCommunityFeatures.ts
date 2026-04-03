import { useCallback, useState } from 'react';
import {
  collection, query, orderBy, getDocs,
  addDoc, deleteDoc, doc, where, limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

// ── Cloudinary helpers ────────────────────────────────────────────────────────

function cloudinaryCloudName() {
  return (import.meta as Record<string, unknown> & { env?: Record<string, string> }).env?.VITE_CLOUDINARY_CLOUD_NAME ?? 'dsqjg9mfg';
}
function cloudinaryUploadPreset() {
  return (import.meta as Record<string, unknown> & { env?: Record<string, string> }).env?.VITE_CLOUDINARY_UPLOAD_PRESET ?? 'ebsumsa';
}

async function uploadToCloudinary(file: File): Promise<string | null> {
  const cloudName = cloudinaryCloudName();
  const preset    = cloudinaryUploadPreset();
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  fd.append('folder', 'community');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const data = await res.json() as { secure_url?: string };
  return data.secure_url ?? null;
}

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order_index?: number;
  created_at: string;
}

export interface Sticker {
  id: string;
  name: string;
  image_url: string;
  category?: string;
  is_animated?: boolean;
  created_at: string;
}

export interface SavedSticker {
  id: string;
  user_id: string;
  sticker_id: string;
  saved_at: string;
  sticker?: Sticker;
}

// Hook for managing subcategories
export const useSubcategories = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubcategories = useCallback(async () => {
    try {
      setLoading(true);
      const snap = await getDocs(
        query(collection(db, 'community_subcategories'), orderBy('order_index', 'asc'))
      );
      const data: Subcategory[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subcategory, 'id'>) }));
      setSubcategories(data);
    } catch (err) {
      console.error('[v0] Error fetching subcategories:', err);
      toast.error('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    subcategories,
    loading,
    fetchSubcategories,
  };
};

// Hook for managing stickers
export const useStickers = (userId: string) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [savedStickers, setSavedStickers] = useState<SavedSticker[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllStickers = useCallback(async () => {
    try {
      setLoading(true);
      const snap = await getDocs(
        query(collection(db, 'community_stickers'), orderBy('category', 'asc'))
      );
      const data: Sticker[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sticker, 'id'>) }));
      setStickers(data);
    } catch (err) {
      console.error('[v0] Error fetching stickers:', err);
      toast.error('Failed to load stickers');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSavedStickers = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'user_saved_stickers'), where('user_id', '==', userId))
      );
      const data: SavedSticker[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedSticker, 'id'>) }));
      setSavedStickers(data);
    } catch (err) {
      console.error('[v0] Error fetching saved stickers:', err);
    }
  }, [userId]);

  const saveSticker = useCallback(
    async (stickerId: string) => {
      try {
        await addDoc(collection(db, 'user_saved_stickers'), {
          user_id: userId,
          sticker_id: stickerId,
          saved_at: serverTimestamp(),
        });
        await fetchSavedStickers();
        toast.success('Sticker saved!');
      } catch (err) {
        console.error('[v0] Error saving sticker:', err);
        toast.error('Failed to save sticker');
      }
    },
    [userId, fetchSavedStickers]
  );

  const removeSticker = useCallback(
    async (stickerId: string) => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'user_saved_stickers'),
            where('user_id', '==', userId),
            where('sticker_id', '==', stickerId),
            limit(1)
          )
        );
        if (!snap.empty) await deleteDoc(doc(db, 'user_saved_stickers', snap.docs[0].id));
        await fetchSavedStickers();
        toast.success('Sticker removed');
      } catch (err) {
        console.error('[v0] Error removing sticker:', err);
        toast.error('Failed to remove sticker');
      }
    },
    [userId, fetchSavedStickers]
  );

  const isStarred = useCallback(
    (stickerId: string) => {
      return savedStickers.some((s) => s.sticker_id === stickerId);
    },
    [savedStickers]
  );

  return {
    stickers,
    savedStickers,
    loading,
    fetchAllStickers,
    fetchSavedStickers,
    saveSticker,
    removeSticker,
    isStarred,
  };
};

// Hook for uploading images via Cloudinary (community messages + private chat)
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  /** Upload a single file, return the secure URL or null */
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10 MB');
      return null;
    }
    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);
      if (!url) throw new Error('No URL returned');
      return url;
    } catch (err) {
      console.error('[v0] Cloudinary upload error:', err);
      toast.error('Image upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  /** Upload multiple files, return array of secure URLs */
  const uploadImages = useCallback(async (files: File[]): Promise<string[]> => {
    setUploading(true);
    try {
      const results = await Promise.all(files.map((f) => uploadToCloudinary(f).catch(() => null)));
      return results.filter((u): u is string => !!u);
    } catch (err) {
      console.error('[v0] Cloudinary multi-upload error:', err);
      toast.error('Some images failed to upload');
      return [];
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, uploadImage, uploadImages };
};

// Hook for managing message images and subcategories
export const useCommunityMessageEnhanced = () => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const addImageUrl = useCallback((url: string) => {
    setImageUrls((prev) => {
      if (prev.length >= 3) {
        toast.error('Maximum 3 images per message');
        return prev;
      }
      return [...prev, url];
    });
  }, []);

  const removeImageUrl = useCallback((index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback(() => {
    setImageUrls([]);
  }, []);

  return {
    imageUrls,
    addImageUrl,
    removeImageUrl,
    clearImages,
  };
};
