// ─── Community Types ──────────────────────────────────────────────────────────
// This file now exports only TypeScript types.
// All data access uses Firebase Firestore (see src/hooks/useCommunity.ts).

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
  image_url?: string;
  sticker_url?: string;
  media_type?: 'text' | 'image' | 'sticker';
  forwarded_from?: string;
  forwarded_from_user?: string;
  sub_community_id?: string;
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
  image_url?: string;
  sticker_url?: string;
  media_type?: 'text' | 'image' | 'sticker';
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

export type SubCommunity = {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color: string;
  parent_topic: string;
  created_by: string;
  member_count: number;
  created_at: string;
  is_active: boolean;
};

export type CommunitySticker = {
  id: string;
  pack_name: string;
  name: string;
  url: string;
  emoji_tags?: string[];
};
