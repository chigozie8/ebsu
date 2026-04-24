import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

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

function rowToBanner(row: Record<string, unknown>): BannerConfig {
  return {
    id: row.id as string,
    text: row.text as string,
    duration: row.duration as number,
    bg_color: row.bg_color as string,
    text_color: row.text_color as string,
    font_size: (row.font_size as number) || 28,
    font_weight: (row.font_weight as 'normal' | 'bold' | 'bolder') || 'bold',
    is_active: row.is_active as boolean,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export const useBannerSettings = () => {
  const [banner, setBanner] = useState<BannerConfig>(DEFAULT_BANNER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBanner = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('hanging_banners')
          .select('*')
          .eq('is_active', true)
          .single();

        if (cancelled) return;

        // PGRST116 = no rows found — totally fine, just means no active banner
        if (queryError && queryError.code !== 'PGRST116') {
          // Table might not exist yet — fail silently, don't crash the app
          setBanner(DEFAULT_BANNER);
          return;
        }

        if (data) {
          setBanner(rowToBanner(data as Record<string, unknown>));
        } else {
          setBanner(DEFAULT_BANNER);
        }
      } catch {
        // Any network or unexpected error — silently fall back to default
        if (!cancelled) setBanner(DEFAULT_BANNER);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBanner();

    // Real-time subscription (Supabase v2 channel API)
    const channel = supabase
      .channel('hanging_banners_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hanging_banners' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row?.is_active) {
            setBanner(rowToBanner(row));
          } else {
            // A banner was deactivated — re-fetch to find if another is now active
            fetchBanner();
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { banner, loading, error };
};
