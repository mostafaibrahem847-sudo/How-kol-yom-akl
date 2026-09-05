-- Phase 7: Supabase Schema

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  category_color TEXT,
  minutes INTEGER,
  persons INTEGER,
  difficulty TEXT,
  rating NUMERIC,
  audio_available BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  occasion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_hint TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tips (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audio_urls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description ON recipes USING gin(to_tsvector('simple', description));
