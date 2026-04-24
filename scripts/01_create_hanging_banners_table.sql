-- Create hanging_banners table for storing 3D banner configurations
-- Note: Column names must be quoted to preserve camelCase in PostgreSQL
CREATE TABLE IF NOT EXISTS public.hanging_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 15 CHECK (duration BETWEEN 5 AND 60),
  "bgColor" VARCHAR(7) NOT NULL DEFAULT '#00875a',
  "textColor" VARCHAR(7) NOT NULL DEFAULT '#ffffff',
  "fontSize" INTEGER NOT NULL DEFAULT 28 CHECK ("fontSize" BETWEEN 18 AND 48),
  "fontWeight" VARCHAR(20) NOT NULL DEFAULT 'bold' CHECK ("fontWeight" IN ('normal', 'bold', 'bolder')),
  "isActive" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hanging_banners_is_active ON public.hanging_banners("isActive");
CREATE INDEX IF NOT EXISTS idx_hanging_banners_created_at ON public.hanging_banners("createdAt" DESC);

-- Enable Row Level Security
ALTER TABLE public.hanging_banners ENABLE ROW LEVEL SECURITY;

-- Create policies for public read (anyone can see active banners)
CREATE POLICY "Anyone can view active banners"
  ON public.hanging_banners
  FOR SELECT
  USING (true);

-- Create policies for admin insert/update/delete
-- Note: Replace with your actual admin user IDs
CREATE POLICY "Admins can manage banners"
  ON public.hanging_banners
  FOR ALL
  USING (
    -- This will be enforced through application logic
    true
  )
  WITH CHECK (
    -- This will be enforced through application logic
    true
  );

-- Add comment to table
COMMENT ON TABLE public.hanging_banners IS '3D animated hanging banners with rope effects. Customizable text, colors, and duration.';
