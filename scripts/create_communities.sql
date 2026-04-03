-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  description  text NOT NULL DEFAULT '',
  icon         text NOT NULL DEFAULT '💬',
  color        text NOT NULL DEFAULT '#00875a',
  banner_url   text,
  member_count integer NOT NULL DEFAULT 0,
  post_count   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Create community_memberships table
CREATE TABLE IF NOT EXISTS community_memberships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community_messages table (if not already created)
CREATE TABLE IF NOT EXISTS community_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  user_id      text NOT NULL,
  user_name    text NOT NULL,
  user_avatar  text,
  message      text NOT NULL,
  topic        text NOT NULL DEFAULT 'General',
  image_urls   text[],
  sticker_url  text,
  likes_count  integer NOT NULL DEFAULT 0,
  reply_count  integer NOT NULL DEFAULT 0,
  is_pinned    boolean NOT NULL DEFAULT false,
  is_edited    boolean NOT NULL DEFAULT false,
  is_deleted   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE communities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages    ENABLE ROW LEVEL SECURITY;

-- RLS Policies: anyone can read active communities
DROP POLICY IF EXISTS "communities_read"        ON communities;
DROP POLICY IF EXISTS "memberships_read"        ON community_memberships;
DROP POLICY IF EXISTS "memberships_write"       ON community_memberships;
DROP POLICY IF EXISTS "messages_read"           ON community_messages;
DROP POLICY IF EXISTS "messages_insert"         ON community_messages;

CREATE POLICY "communities_read"
  ON communities FOR SELECT USING (is_active = true);

CREATE POLICY "memberships_read"
  ON community_memberships FOR SELECT USING (true);

CREATE POLICY "memberships_write"
  ON community_memberships FOR ALL USING (true);

CREATE POLICY "messages_read"
  ON community_messages FOR SELECT USING (is_deleted = false);

CREATE POLICY "messages_insert"
  ON community_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_update"
  ON community_messages FOR UPDATE USING (true);

-- Seed default EBSU communities (skip if already exist)
INSERT INTO communities (name, slug, description, icon, color, member_count, post_count, is_active)
VALUES
  ('General', 'general', 'General discussions for all EBSU Medical students', '💬', '#00875a', 0, 0, true),
  ('Academics', 'academics', 'Study tips, past questions, and academic resources', '📚', '#1d4ed8', 0, 0, true),
  ('Campus Life', 'campus-life', 'Everything happening on and around EBSU campus', '🏫', '#be185d', 0, 0, true),
  ('Health & Wellness', 'health-wellness', 'Medical discussions, health tips and wellness advice', '🏥', '#dc2626', 0, 0, true),
  ('Tech & Innovation', 'tech-innovation', 'Technology, software and innovation discussions', '💻', '#7c3aed', 0, 0, true),
  ('Events', 'events', 'Upcoming events, seminars and extracurricular activities', '🎉', '#d97706', 0, 0, true)
ON CONFLICT (slug) DO NOTHING;
