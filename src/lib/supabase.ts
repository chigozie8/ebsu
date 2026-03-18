import { createClient } from '@supabase/supabase-js';

// Vite exposes VITE_* vars via import.meta.env natively.
// vite.config.ts also injects SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL into
// import.meta.env.VITE_SUPABASE_URL at build time via the define block.
const supabaseUrl: string =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (process.env.SUPABASE_URL as string) ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  '';

const supabaseAnonKey: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (process.env.SUPABASE_ANON_KEY as string) ||
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[v0] Supabase env vars missing — quizzes and community will not load.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Community = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  topic: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_edited: boolean;
  is_deleted: boolean;
};

export type CommunityReply = {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  reply: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
};

export type CommunityLike = {
  id: string;
  message_id: string;
  user_id: string;
  created_at: string;
};

export type CommunityReport = {
  id: string;
  message_id: string;
  reported_by: string;
  reason?: string;
  created_at: string;
  status: string;
};

export type CommunityReaction = {
  id: string;
  message_id: string;
  user_id: string;
  reaction_emoji: string;
  created_at: string;
};

export type CommunityGuideline = {
  id: string;
  content: string;
  created_at: string;
};
