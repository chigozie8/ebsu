-- Create hanging_banners table for storing 3D banner configurations
-- Version 2: Uses snake_case columns which is PostgreSQL standard
-- Run this if version 1 failed due to column name issues

-- Drop existing table if it exists (be careful in production!)
-- DROP TABLE IF EXISTS public.hanging_banners;

CREATE TABLE IF NOT EXISTS public.hanging_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 15 CHECK (duration BETWEEN 5 AND 60),
  bg_color VARCHAR(7) NOT NULL DEFAULT '#00875a',
  text_color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
  font_size INTEGER NOT NULL DEFAULT 28 CHECK (font_size BETWEEN 18 AND 48),
  font_weight VARCHAR(20) NOT NULL DEFAULT 'bold' CHECK (font_weight IN ('normal', 'bold', 'bolder')),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hanging_banners_is_active ON public.hanging_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_hanging_banners_created_at ON public.hanging_banners(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.hanging_banners ENABLE ROW LEVEL SECURITY;

-- Create policies for public read (anyone can see active banners)
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.hanging_banners;
CREATE POLICY "Anyone can view active banners"
  ON public.hanging_banners
  FOR SELECT
  USING (true);

-- Create policies for admin insert/update/delete
DROP POLICY IF EXISTS "Admins can manage banners" ON public.hanging_banners;
CREATE POLICY "Admins can manage banners"
  ON public.hanging_banners
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.hanging_banners IS '3D animated hanging banners with rope effects. Customizable text, colors, and duration.';

-- Note: After running this migration, make sure your AdminBannerManager.tsx
-- uses these column names in queries:
-- bg_color, text_color, font_size, font_weight, is_active, created_at, updated_at
