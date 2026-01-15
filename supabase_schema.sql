-- HDFlowsheet Cloud - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Main data storage table (one row per data type)
CREATE TABLE IF NOT EXISTS app_data (
  type TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup history table (keeps revision history)
CREATE TABLE IF NOT EXISTS app_data_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster backup queries
CREATE INDEX IF NOT EXISTS idx_backups_type_created
ON app_data_backups(type, created_at DESC);

-- Optional: Enable Row Level Security (RLS) if you want to add auth later
-- ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_data_backups ENABLE ROW LEVEL SECURITY;

-- Insert initial empty records (optional)
INSERT INTO app_data (type, data) VALUES
  ('flowsheet', '{}'),
  ('operations', '{}'),
  ('snippets', '{}')
ON CONFLICT (type) DO NOTHING;
