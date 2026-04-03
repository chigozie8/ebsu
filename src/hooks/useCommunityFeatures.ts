import { useCallback, useState } from 'react';
import {
  collection, query, orderBy, getDocs,
  addDoc, deleteDoc, doc, where, limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import toast from 'react-hot-toast';

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

// Hook for uploading images to community messages
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = useCallback(async (file: File, userId: string): Promise<string | null> => {
    try {
      setUploading(true);

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return null;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return null;
      }

      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}-${file.name}`;
      const filePath = `community-images/${fileName}`;

      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);

      return downloadUrl;
    } catch (err) {
      console.error('[v0] Error uploading image:', err);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    uploadImage,
  };
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
