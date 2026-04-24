import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
} from 'firebase/firestore';

export interface BannerConfig {
  id: string;
  text: string;
  duration: number;
  bg_color: string;
  text_color: string;
  font_size: number;
  font_weight: 'normal' | 'bold' | 'bolder';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_BANNER: BannerConfig = {
  id: 'default',
  text: 'Welcome to EBSUMSA',
  duration: 15,
  bg_color: '#00875a',
  text_color: '#ffffff',
  font_size: 28,
  font_weight: 'bold',
  is_active: false,
};

function docToBanner(id: string, data: Record<string, unknown>): BannerConfig {
  return {
    id,
    text: (data.text as string) || '',
    duration: (data.duration as number) || 15,
    bg_color: (data.bg_color as string) || '#00875a',
    text_color: (data.text_color as string) || '#ffffff',
    font_size: (data.font_size as number) || 28,
    font_weight: (data.font_weight as 'normal' | 'bold' | 'bolder') || 'bold',
    is_active: Boolean(data.is_active),
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
  };
}

export const useBannerSettings = () => {
  const [banner, setBanner] = useState<BannerConfig>(DEFAULT_BANNER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates for the active banner
    const q = query(
      collection(db, 'hanging_banners'),
      where('is_active', '==', true),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setBanner(docToBanner(doc.id, doc.data() as Record<string, unknown>));
        } else {
          setBanner(DEFAULT_BANNER);
        }
        setLoading(false);
        setError(null);
      },
      () => {
        // Fail silently — banner is non-critical
        setBanner(DEFAULT_BANNER);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { banner, loading, error };
};
