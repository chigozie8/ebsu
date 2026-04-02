import { createClient } from '@supabase/supabase-js';

// These fallbacks mirror src/lib/supabase.ts so both clients always point to
// the real project database even when Vite env vars are not injected.
const FALLBACK_URL = 'https://pymwhvvosdjeycjelmef.supabase.co';
const FALLBACK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bXdodnZvc2RqZXljamVsbWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTk0MjcsImV4cCI6MjA5MDY5NTQyN30.VFDBMiorgHlAWfC-V555VNWVXa_To5t6LyxD9C3IAkQ';

const supabaseUrl: string =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (process.env.SUPABASE_URL as string) ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  FALLBACK_URL;

const supabaseAnonKey: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (process.env.SUPABASE_ANON_KEY as string) ||
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  FALLBACK_KEY;

const supabaseServiceKey: string =
  (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string) ||
  (process.env.SUPABASE_SERVICE_ROLE_KEY as string) ||
  supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client using service role key — bypasses RLS, use only for admin/storage operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  ID_CARDS: 'id-cards',
  LEARNING_RESOURCES: 'learning-resources',
  PAYMENT_RECEIPTS: 'id-cards',
  ADVERTISEMENTS: 'advertisements',
  COMMUNITY_IMAGES: 'community-images',
} as const;

// Helper to get public URL for a file
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
