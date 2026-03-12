import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  ID_CARDS: 'id-cards',
  LEARNING_RESOURCES: 'learning-resources',
} as const;

// Helper to get public URL for a file
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
