import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks ensure the client always connects even when env vars
// are not yet injected (e.g. first load in preview, Vite define race, etc.)
const FALLBACK_URL = 'https://fmjxxldlqirmnzkekjkf.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtanh4bGRscWlybW56a2VramtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzA0NzIsImV4cCI6MjA4OTQ0NjQ3Mn0.PX18WAPpzzg-emMbxV2bz-yR5fo-MjvVMvDQAYZeTrc';

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
