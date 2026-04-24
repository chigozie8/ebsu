import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks ensure the client always connects even when env vars
// are not yet injected (e.g. first load in preview, Vite define race, etc.)
const FALLBACK_URL = 'https://syfyjowpqzqtizlnrtal.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5Znlqb3dwcXpxdGl6bG5ydGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDkxMTYsImV4cCI6MjA5MDcyNTExNn0.9dFXwi6uRPg1TpUO-oevRlWcrt6bY6DT4Z3fi4_eht4';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client using service role key — bypasses RLS, use only for admin/storage operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

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
