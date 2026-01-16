-- HDFlowsheet Cloud - Normalized Schema v2
-- Run this in your Supabase SQL Editor
-- WARNING: This will DROP and recreate tables. Backup any existing data first!

-- ============================================
-- DROP existing empty tables (safe to drop if 0 rows)
-- ============================================
DROP TABLE IF EXISTS checklist_completions CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS checklist_folders CASCADE;
DROP TABLE IF EXISTS checklists CASCADE;
DROP TABLE IF EXISTS labs CASCADE;

-- ============================================
-- LABS TABLE
-- ============================================
CREATE TABLE labs (
    id BIGSERIAL PRIMARY KEY,
    patient_name TEXT NOT NULL,
    lab_result TEXT NOT NULL,
    date_time TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_labs_created_at ON labs(created_at DESC);

-- ============================================
-- CHECKLISTS TABLE
-- ============================================
CREATE TABLE checklists (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHECKLIST FOLDERS TABLE
-- ============================================
CREATE TABLE checklist_folders (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklist_folders_checklist ON checklist_folders(checklist_id);

-- ============================================
-- CHECKLIST ITEMS TABLE
-- ============================================
CREATE TABLE checklist_items (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    folder_id BIGINT REFERENCES checklist_folders(id) ON DELETE SET NULL,
    item_text TEXT NOT NULL,
    url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_folder ON checklist_items(folder_id);

-- ============================================
-- CHECKLIST COMPLETIONS TABLE
-- Tracks which items are completed on which dates
-- ============================================
CREATE TABLE checklist_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id BIGINT NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(checklist_id, item_id, completion_date)
);

CREATE INDEX idx_completions_date ON checklist_completions(completion_date DESC);
CREATE INDEX idx_completions_checklist ON checklist_completions(checklist_id);

-- ============================================
-- Keep app_data for flowsheet, snippets, etc.
-- (These work fine as JSON blobs)
-- ============================================
-- app_data table should already exist from previous setup

-- ============================================
-- SUMMARY OF TABLES
-- ============================================
-- labs                    - Individual lab entries (normalized)
-- checklists              - Checklist definitions
-- checklist_folders       - Folders within checklists
-- checklist_items         - Individual checklist items
-- checklist_completions   - Daily completion tracking
-- app_data                - JSON storage for flowsheet, snippets, etc.
-- app_data_backups        - Backup history
