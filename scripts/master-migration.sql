-- ─────────────────────────────────────────────────────────────────────────────
-- EBSU Master Migration
-- Creates all community tables from scratch + WhatsApp-like features
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. CORE COMMUNITY TABLES

CREATE TABLE IF NOT EXISTS community_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  user_avatar      TEXT,
  message          TEXT NOT NULL,
  topic            VARCHAR(50) DEFAULT 'General',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  likes_count      INT DEFAULT 0,
  reply_count      INT DEFAULT 0,
  is_pinned        BOOLEAN DEFAULT false,
  is_edited        BOOLEAN DEFAULT false,
  is_deleted       BOOLEAN DEFAULT false,
  -- WhatsApp features
  image_url        TEXT,
  sticker_url      TEXT,
  media_type       VARCHAR(20) DEFAULT 'text',
  forwarded_from   UUID,
  sub_community_id UUID
);

CREATE TABLE IF NOT EXISTS community_replies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  user_name    TEXT NOT NULL,
  user_avatar  TEXT,
  reply        TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  is_edited    BOOLEAN DEFAULT false,
  is_deleted   BOOLEAN DEFAULT false,
  -- WhatsApp features
  image_url    TEXT,
  sticker_url  TEXT,
  media_type   VARCHAR(20) DEFAULT 'text'
);

CREATE TABLE IF NOT EXISTS community_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  reported_by TEXT NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  status      VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS community_analytics (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date               DATE DEFAULT CURRENT_DATE,
  total_messages     INT DEFAULT 0,
  total_replies      INT DEFAULT 0,
  active_users       INT DEFAULT 0,
  top_topics         JSONB,
  reported_messages  INT DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_reactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL,
  reaction_emoji TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, reaction_emoji)
);

-- 2. PREMIUM COMMUNITY TABLES

CREATE TABLE IF NOT EXISTS premium_community_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  user_name       TEXT NOT NULL,
  user_avatar     TEXT,
  content         TEXT NOT NULL,
  image_url       TEXT,
  likes_count     INT NOT NULL DEFAULT 0,
  replies_count   INT NOT NULL DEFAULT 0,
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_community_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES premium_community_messages(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  user_avatar TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS premium_community_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES premium_community_messages(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- 3. WHATSAPP-LIKE FEATURE TABLES

-- Sub-communities (channels inside the community, like WhatsApp groups)
CREATE TABLE IF NOT EXISTS community_sub_communities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  icon_url     TEXT,
  color        VARCHAR(20) DEFAULT '#14b8a6',
  parent_topic VARCHAR(50) DEFAULT 'General',
  created_by   TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active    BOOLEAN NOT NULL DEFAULT true
);

-- Sub-community membership
CREATE TABLE IF NOT EXISTS community_sub_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_community_id UUID NOT NULL REFERENCES community_sub_communities(id) ON DELETE CASCADE,
  user_id          TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  user_avatar      TEXT,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sub_community_id, user_id)
);

-- Saved / starred messages
CREATE TABLE IF NOT EXISTS community_saved_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Sticker packs
CREATE TABLE IF NOT EXISTS community_stickers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_name  TEXT NOT NULL DEFAULT 'General',
  name       TEXT NOT NULL,
  url        TEXT NOT NULL,
  emoji_tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active  BOOLEAN NOT NULL DEFAULT true
);

-- 4. FK CONSTRAINTS (added after tables exist)

ALTER TABLE community_messages
  ADD CONSTRAINT IF NOT EXISTS fk_message_forwarded
    FOREIGN KEY (forwarded_from) REFERENCES community_messages(id) ON DELETE SET NULL;

ALTER TABLE community_messages
  ADD CONSTRAINT IF NOT EXISTS fk_message_sub_community
    FOREIGN KEY (sub_community_id) REFERENCES community_sub_communities(id) ON DELETE SET NULL;

-- 5. INDEXES

CREATE INDEX IF NOT EXISTS idx_community_messages_created_at  ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_topic        ON community_messages(topic);
CREATE INDEX IF NOT EXISTS idx_community_messages_user_id      ON community_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_sub_community ON community_messages(sub_community_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_message_id    ON community_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_message_id      ON community_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id         ON community_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_message_id  ON community_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_user_id     ON community_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_members_user_id             ON community_sub_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_members_sub_id              ON community_sub_members(sub_community_id);
CREATE INDEX IF NOT EXISTS idx_saved_messages_user             ON community_saved_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_stickers_pack                   ON community_stickers(pack_name);
CREATE INDEX IF NOT EXISTS idx_pcm_created_at                  ON premium_community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pcm_is_pinned                   ON premium_community_messages(is_pinned);
CREATE INDEX IF NOT EXISTS idx_pcr_message_id                  ON premium_community_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_pcl_message_id                  ON premium_community_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_pcl_user_id                     ON premium_community_likes(user_id);

-- 6. ROW LEVEL SECURITY

ALTER TABLE community_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_sub_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_sub_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_saved_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_stickers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_community_replies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_community_likes    ENABLE ROW LEVEL SECURITY;

-- community_messages policies
CREATE POLICY "public_read_messages"   ON community_messages FOR SELECT USING (true);
CREATE POLICY "public_insert_messages" ON community_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_messages" ON community_messages FOR UPDATE USING (true);
CREATE POLICY "public_delete_messages" ON community_messages FOR DELETE USING (true);

-- community_replies policies
CREATE POLICY "public_read_replies"   ON community_replies FOR SELECT USING (true);
CREATE POLICY "public_insert_replies" ON community_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_replies" ON community_replies FOR UPDATE USING (true);
CREATE POLICY "public_delete_replies" ON community_replies FOR DELETE USING (true);

-- community_likes policies
CREATE POLICY "public_read_likes"   ON community_likes FOR SELECT USING (true);
CREATE POLICY "public_insert_likes" ON community_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_likes" ON community_likes FOR DELETE USING (true);

-- community_reactions policies
CREATE POLICY "public_read_reactions"   ON community_reactions FOR SELECT USING (true);
CREATE POLICY "public_insert_reactions" ON community_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_reactions" ON community_reactions FOR DELETE USING (true);

-- community_reports policies
CREATE POLICY "public_read_reports"   ON community_reports FOR SELECT USING (true);
CREATE POLICY "public_insert_reports" ON community_reports FOR INSERT WITH CHECK (true);

-- sub-communities policies
CREATE POLICY "public_read_sub_communities"   ON community_sub_communities FOR SELECT USING (true);
CREATE POLICY "public_insert_sub_communities" ON community_sub_communities FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_sub_communities" ON community_sub_communities FOR UPDATE USING (true);

-- sub-members policies
CREATE POLICY "public_read_sub_members"   ON community_sub_members FOR SELECT USING (true);
CREATE POLICY "public_insert_sub_members" ON community_sub_members FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_sub_members" ON community_sub_members FOR DELETE USING (true);

-- saved messages policies
CREATE POLICY "public_read_saved"   ON community_saved_messages FOR SELECT USING (true);
CREATE POLICY "public_insert_saved" ON community_saved_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_saved" ON community_saved_messages FOR DELETE USING (true);

-- stickers policies
CREATE POLICY "public_read_stickers" ON community_stickers FOR SELECT USING (true);

-- premium messages policies
CREATE POLICY "read_messages"   ON premium_community_messages FOR SELECT USING (true);
CREATE POLICY "insert_messages" ON premium_community_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "update_messages" ON premium_community_messages FOR UPDATE USING (true);
CREATE POLICY "delete_messages" ON premium_community_messages FOR DELETE USING (true);

CREATE POLICY "read_replies"   ON premium_community_replies FOR SELECT USING (true);
CREATE POLICY "insert_replies" ON premium_community_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_replies" ON premium_community_replies FOR DELETE USING (true);

CREATE POLICY "read_likes"   ON premium_community_likes FOR SELECT USING (true);
CREATE POLICY "insert_likes" ON premium_community_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_likes" ON premium_community_likes FOR DELETE USING (true);

-- 7. REALTIME

ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE community_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE community_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE community_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE community_sub_communities;
ALTER PUBLICATION supabase_realtime ADD TABLE community_sub_members;
ALTER PUBLICATION supabase_realtime ADD TABLE community_saved_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE premium_community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE premium_community_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE premium_community_likes;

-- 8. FUNCTIONS & TRIGGERS

CREATE OR REPLACE FUNCTION increment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_messages SET reply_count = reply_count + 1 WHERE id = NEW.message_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_reply_count
AFTER INSERT ON community_replies
FOR EACH ROW EXECUTE FUNCTION increment_reply_count();

CREATE OR REPLACE FUNCTION decrement_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_messages SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.message_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_reply_count
AFTER DELETE ON community_replies
FOR EACH ROW EXECUTE FUNCTION decrement_reply_count();

CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_messages SET likes_count = likes_count + 1 WHERE id = NEW.message_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_messages SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.message_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON community_likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

CREATE OR REPLACE FUNCTION update_sub_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_sub_communities SET member_count = member_count + 1 WHERE id = NEW.sub_community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_sub_communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.sub_community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sub_community_member_count
AFTER INSERT OR DELETE ON community_sub_members
FOR EACH ROW EXECUTE FUNCTION update_sub_community_member_count();

-- 9. DEFAULT STICKERS

INSERT INTO community_stickers (pack_name, name, url, emoji_tags) VALUES
  ('Reactions', 'Thumbs Up',  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/emoji.svg',        ARRAY['thumbs','up','good','like']),
  ('Reactions', 'Heart',      'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/emoji.svg',    ARRAY['heart','love','like']),
  ('Reactions', 'Fire',       'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/emoji.svg',        ARRAY['fire','hot','lit']),
  ('Reactions', 'Clap',       'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/emoji.svg',        ARRAY['clap','congrats','bravo']),
  ('Reactions', 'Laugh',      'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/emoji.svg',        ARRAY['laugh','haha','funny']),
  ('Reactions', 'Wow',        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/emoji.svg',        ARRAY['wow','amazed','surprise']),
  ('Reactions', 'Sad',        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/emoji.svg',        ARRAY['sad','cry','upset']),
  ('Reactions', 'Angry',      'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/emoji.svg',        ARRAY['angry','mad','rage']),
  ('Study',     'Books',      'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4da/emoji.svg',        ARRAY['books','study','learn']),
  ('Study',     'Graduation', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f393/emoji.svg',        ARRAY['graduation','grad','school']),
  ('Study',     'Pencil',     'https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/emoji.svg',    ARRAY['pencil','write','notes']),
  ('Study',     'Bulb',       'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a1/emoji.svg',        ARRAY['bulb','idea','think']),
  ('Campus',    'Wave',       'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/emoji.svg',        ARRAY['wave','hi','hello']),
  ('Campus',    'Party',      'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/emoji.svg',        ARRAY['party','celebrate','yay']),
  ('Campus',    'Coffee',     'https://fonts.gstatic.com/s/e/notoemoji/latest/2615/emoji.svg',         ARRAY['coffee','drink','break'])
ON CONFLICT DO NOTHING;
