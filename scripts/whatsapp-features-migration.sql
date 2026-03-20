-- ─────────────────────────────────────────────────────────────────────────────
-- WhatsApp-like features migration
-- Adds: image/sticker support on messages & replies,
--        sub-communities, saved messages, forwarded messages
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add media columns to existing community_messages table
ALTER TABLE community_messages
  ADD COLUMN IF NOT EXISTS image_url       TEXT,
  ADD COLUMN IF NOT EXISTS sticker_url     TEXT,
  ADD COLUMN IF NOT EXISTS media_type      VARCHAR(20) DEFAULT 'text',  -- 'text' | 'image' | 'sticker'
  ADD COLUMN IF NOT EXISTS forwarded_from  UUID REFERENCES community_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sub_community_id UUID;

-- 2. Add media columns to community_replies table
ALTER TABLE community_replies
  ADD COLUMN IF NOT EXISTS image_url   TEXT,
  ADD COLUMN IF NOT EXISTS sticker_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type  VARCHAR(20) DEFAULT 'text';

-- 3. Sub-communities table (channels inside a community, like WhatsApp groups inside Communities)
CREATE TABLE IF NOT EXISTS community_sub_communities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  icon_url    TEXT,
  color       VARCHAR(20) DEFAULT '#14b8a6',
  parent_topic VARCHAR(50) DEFAULT 'General',
  created_by  TEXT        NOT NULL,
  member_count INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active   BOOLEAN     NOT NULL DEFAULT true
);

-- 4. Sub-community membership
CREATE TABLE IF NOT EXISTS community_sub_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_community_id UUID NOT NULL REFERENCES community_sub_communities(id) ON DELETE CASCADE,
  user_id          TEXT NOT NULL,
  user_name        TEXT NOT NULL,
  user_avatar      TEXT,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sub_community_id, user_id)
);

-- 5. Saved messages (bookmark feature like WhatsApp Starred Messages)
CREATE TABLE IF NOT EXISTS community_saved_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- 6. Sticker packs / custom stickers
CREATE TABLE IF NOT EXISTS community_stickers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_name   TEXT NOT NULL DEFAULT 'General',
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  emoji_tags  TEXT[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- Insert default sticker pack (using emoji-based text stickers via unicode)
INSERT INTO community_stickers (pack_name, name, url, emoji_tags) VALUES
  ('Reactions', 'Thumbs Up',    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/emoji.svg', ARRAY['thumbs','up','good','like']),
  ('Reactions', 'Heart',        'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/emoji.svg', ARRAY['heart','love','like']),
  ('Reactions', 'Fire',         'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/emoji.svg', ARRAY['fire','hot','lit']),
  ('Reactions', 'Clap',         'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/emoji.svg', ARRAY['clap','congrats','bravo']),
  ('Reactions', 'Laugh',        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/emoji.svg', ARRAY['laugh','haha','funny']),
  ('Reactions', 'Wow',          'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/emoji.svg', ARRAY['wow','amazed','surprise']),
  ('Reactions', 'Sad',          'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/emoji.svg', ARRAY['sad','cry','upset']),
  ('Reactions', 'Angry',        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/emoji.svg', ARRAY['angry','mad','rage']),
  ('Study',     'Books',        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4da/emoji.svg', ARRAY['books','study','learn']),
  ('Study',     'Graduation',   'https://fonts.gstatic.com/s/e/notoemoji/latest/1f393/emoji.svg', ARRAY['graduation','grad','school']),
  ('Study',     'Pencil',       'https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/emoji.svg', ARRAY['pencil','write','notes']),
  ('Study',     'Bulb',         'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a1/emoji.svg', ARRAY['bulb','idea','think']),
  ('Campus',    'Wave',         'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/emoji.svg', ARRAY['wave','hi','hello']),
  ('Campus',    'Party',        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/emoji.svg', ARRAY['party','celebrate','yay']),
  ('Campus',    'Coffee',       'https://fonts.gstatic.com/s/e/notoemoji/latest/2615/emoji.svg', ARRAY['coffee','drink','break'])
ON CONFLICT DO NOTHING;

-- 7. Add FK from community_messages to sub-communities
ALTER TABLE community_messages
  ADD CONSTRAINT fk_message_sub_community
  FOREIGN KEY (sub_community_id)
  REFERENCES community_sub_communities(id)
  ON DELETE SET NULL;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_community_messages_sub_community ON community_messages(sub_community_id);
CREATE INDEX IF NOT EXISTS idx_sub_members_user_id ON community_sub_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_members_sub_id  ON community_sub_members(sub_community_id);
CREATE INDEX IF NOT EXISTS idx_saved_messages_user  ON community_saved_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_stickers_pack        ON community_stickers(pack_name);

-- 9. RLS for new tables
ALTER TABLE community_sub_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_sub_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_saved_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_stickers        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_sub_communities"   ON community_sub_communities FOR SELECT USING (true);
CREATE POLICY "public_insert_sub_communities" ON community_sub_communities FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_sub_communities" ON community_sub_communities FOR UPDATE USING (true);

CREATE POLICY "public_read_sub_members"   ON community_sub_members FOR SELECT USING (true);
CREATE POLICY "public_insert_sub_members" ON community_sub_members FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_sub_members" ON community_sub_members FOR DELETE USING (true);

CREATE POLICY "public_read_saved"   ON community_saved_messages FOR SELECT USING (true);
CREATE POLICY "public_insert_saved" ON community_saved_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_saved" ON community_saved_messages FOR DELETE USING (true);

CREATE POLICY "public_read_stickers" ON community_stickers FOR SELECT USING (true);

-- 10. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE community_sub_communities;
ALTER PUBLICATION supabase_realtime ADD TABLE community_sub_members;
ALTER PUBLICATION supabase_realtime ADD TABLE community_saved_messages;

-- 11. Function to update sub_community member_count on join/leave
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
