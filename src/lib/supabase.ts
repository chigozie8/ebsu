import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[v0] Supabase Config:', {
  url: supabaseUrl ? 'Set' : 'NOT SET',
  key: supabaseAnonKey ? 'Set' : 'NOT SET',
  urlValue: supabaseUrl,
  keyValue: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[v0] ERROR: Missing Supabase environment variables!');
  console.error('[v0] VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET');
  console.error('[v0] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'NOT SET');
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
