import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface BannerConfig {
  id: string;
  text: string;
  duration: number; // in seconds (5-60)
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'bolder';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_BANNER: BannerConfig = {
  id: 'default',
  text: 'Welcome to EBSUMSA',
  duration: 15,
  bgColor: '#00875a',
  textColor: '#ffffff',
  fontSize: 28,
  fontWeight: 'bold',
  isActive: false,
};

export const useBannerSettings = () => {
  const [banner, setBanner] = useState<BannerConfig>(DEFAULT_BANNER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch banner config from Supabase
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('hanging_banners')
          .select('*')
          .eq('isActive', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is fine
          throw error;
        }

        if (data) {
          setBanner({
            id: data.id,
            text: data.text,
            duration: data.duration,
            bgColor: data.bgColor,
            textColor: data.textColor,
            fontSize: data.fontSize || 28,
            fontWeight: data.fontWeight || 'bold',
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        } else {
          setBanner(DEFAULT_BANNER);
        }
      } catch (err) {
        console.error('Error fetching banner:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch banner');
        setBanner(DEFAULT_BANNER);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();

    // Set up real-time subscription
    const subscription = supabase
      .from('hanging_banners')
      .on('*', (payload) => {
        console.log('Banner updated:', payload);
        if (payload.new?.isActive) {
          setBanner({
            id: payload.new.id,
            text: payload.new.text,
            duration: payload.new.duration,
            bgColor: payload.new.bgColor,
            textColor: payload.new.textColor,
            fontSize: payload.new.fontSize || 28,
            fontWeight: payload.new.fontWeight || 'bold',
            isActive: payload.new.isActive,
            createdAt: payload.new.createdAt,
            updatedAt: payload.new.updatedAt,
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { banner, loading, error };
};
