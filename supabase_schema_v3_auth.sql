-- HDFlowsheet Cloud - Auth Schema Update (v3)
-- Run this AFTER supabase_schema_v2.sql
-- Adds user_id columns to associate data with specific users

-- ============================================
-- ADD user_id TO app_data TABLE
-- ============================================
ALTER TABLE app_data ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_app_data_user ON app_data(user_id);

-- Update unique constraint to include user_id
-- First drop the old primary key
ALTER TABLE app_data DROP CONSTRAINT IF EXISTS app_data_pkey;
-- Create new composite primary key
ALTER TABLE app_data ADD PRIMARY KEY (type, user_id);

-- ============================================
-- ADD user_id TO app_data_backups TABLE
-- ============================================
ALTER TABLE app_data_backups ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_app_data_backups_user ON app_data_backups(user_id);

-- ============================================
-- ADD user_id TO labs TABLE
-- ============================================
ALTER TABLE labs ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_labs_user ON labs(user_id);

-- ============================================
-- ADD user_id TO checklists TABLE
-- ============================================
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_checklists_user ON checklists(user_id);

-- Note: checklist_items, checklist_folders, and checklist_completions
-- are linked to checklists via foreign keys, so they inherit the user
-- association through their checklist_id relationship.

-- ============================================
-- OPTIONAL: Enable Row Level Security (RLS)
-- This adds an extra layer of security
-- ============================================
-- ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can only see their own data" ON app_data
--     FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own labs" ON labs
--     FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can only see their own checklists" ON checklists
--     FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SUMMARY
-- ============================================
-- After running this migration:
-- - app_data: user_id column added, composite primary key (type, user_id)
-- - labs: user_id column added
-- - checklists: user_id column added (cascades to items, folders, completions)
--
-- Each user will have their own separate data that doesn't interfere with others.
