import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface BannerConfig {
  id: string;
  text: string;
  duration: number; // in seconds (5-60)
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
          .eq('is_active', true)
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
            bg_color: data.bg_color,
            text_color: data.text_color,
            font_size: data.font_size || 28,
            font_weight: data.font_weight || 'bold',
            is_active: data.is_active,
            created_at: data.created_at,
            updated_at: data.updated_at,
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

    // Set up real-time subscription using Supabase v2 channel API
    const channel = supabase
      .channel('hanging_banners_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hanging_banners',
        },
        (payload) => {
          console.log('Banner updated:', payload);
          const newData = payload.new as Record<string, unknown>;
          if (newData?.is_active) {
            setBanner({
              id: newData.id as string,
              text: newData.text as string,
              duration: newData.duration as number,
              bg_color: newData.bg_color as string,
              text_color: newData.text_color as string,
              font_size: (newData.font_size as number) || 28,
              font_weight: (newData.font_weight as 'normal' | 'bold' | 'bolder') || 'bold',
              is_active: newData.is_active as boolean,
              created_at: newData.created_at as string,
              updated_at: newData.updated_at as string,
            });
          } else {
            // If banner was deactivated, refetch to get the currently active one
            fetchBanner();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { banner, loading, error };
};
