-- Create community_subcategories table
CREATE TABLE IF NOT EXISTS community_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subcategories_community_id ON community_subcategories(community_id);

-- Create community_stickers table (library of available stickers)
CREATE TABLE IF NOT EXISTS community_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  category VARCHAR(50),
  is_animated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stickers_community_id ON community_stickers(community_id);
CREATE INDEX IF NOT EXISTS idx_stickers_category ON community_stickers(category);

-- Create user_saved_stickers table (user's favorite stickers)
CREATE TABLE IF NOT EXISTS user_saved_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_id UUID NOT NULL REFERENCES community_stickers(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, sticker_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_stickers_user_id ON user_saved_stickers(user_id);

-- Alter community_messages table to support images and subcategories
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES community_subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_subcategory_id ON community_messages(subcategory_id);
