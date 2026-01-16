-- HDFlowsheet Cloud - Row Level Security (v4)
-- Run this AFTER supabase_schema_v3_auth.sql
-- Enables RLS to enforce data isolation at database level

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR app_data
-- ============================================

-- Users can view their own data
CREATE POLICY "app_data_select_own" ON app_data
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "app_data_insert_own" ON app_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "app_data_update_own" ON app_data
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own data
CREATE POLICY "app_data_delete_own" ON app_data
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR app_data_backups
-- ============================================

CREATE POLICY "app_data_backups_select_own" ON app_data_backups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "app_data_backups_insert_own" ON app_data_backups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_data_backups_delete_own" ON app_data_backups
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR labs
-- ============================================

CREATE POLICY "labs_select_own" ON labs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "labs_insert_own" ON labs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "labs_update_own" ON labs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "labs_delete_own" ON labs
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR checklists
-- ============================================

CREATE POLICY "checklists_select_own" ON checklists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "checklists_insert_own" ON checklists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checklists_update_own" ON checklists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "checklists_delete_own" ON checklists
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR checklist_items
-- Users can access items belonging to their checklists
-- ============================================

CREATE POLICY "checklist_items_select_own" ON checklist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_items.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

CREATE POLICY "checklist_items_insert_own" ON checklist_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_items.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

CREATE POLICY "checklist_items_update_own" ON checklist_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_items.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

CREATE POLICY "checklist_items_delete_own" ON checklist_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_items.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

-- ============================================
-- RLS POLICIES FOR checklist_folders
-- ============================================

CREATE POLICY "checklist_folders_select_own" ON checklist_folders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_folders.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

CREATE POLICY "checklist_folders_insert_own" ON checklist_folders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_folders.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

CREATE POLICY "checklist_folders_update_own" ON checklist_folders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_folders.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

CREATE POLICY "checklist_folders_delete_own" ON checklist_folders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_folders.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

-- ============================================
-- RLS POLICIES FOR checklist_completions
-- ============================================

CREATE POLICY "checklist_completions_select_own" ON checklist_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_completions.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

CREATE POLICY "checklist_completions_insert_own" ON checklist_completions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_completions.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

CREATE POLICY "checklist_completions_delete_own" ON checklist_completions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM checklists
            WHERE checklists.id = checklist_completions.checklist_id
            AND checklists.user_id = auth.uid()
        )
    );

-- ============================================
-- ENABLE REALTIME FOR TABLES
-- This allows clients to subscribe to changes
-- ============================================

-- Note: Run these in Supabase Dashboard > Database > Replication
-- or use the following commands:

ALTER PUBLICATION supabase_realtime ADD TABLE app_data;
ALTER PUBLICATION supabase_realtime ADD TABLE labs;
ALTER PUBLICATION supabase_realtime ADD TABLE checklists;

-- ============================================
-- SUMMARY
-- ============================================
-- After running this migration:
-- - All tables have RLS enabled
-- - Users can only access their own data
-- - Service role key still bypasses RLS (for admin/migration tasks)
-- - Realtime subscriptions will respect RLS policies
--
-- IMPORTANT: After enabling RLS, update your API endpoints to
-- pass the user's JWT token, not the service role key, for
-- user-context operations.
