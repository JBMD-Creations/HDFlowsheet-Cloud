-- HDFlowsheet Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  chair INTEGER,
  tech TEXT,
  pod TEXT,
  section TEXT CHECK (section IN ('B1', 'B2', 'A1', 'A2', 'TCH')),
  shift TEXT CHECK (shift IN ('1st', '2nd', '3rd')),
  dry_weight DECIMAL(6,2),
  pre_weight DECIMAL(6,2),
  goal_uf DECIMAL(6,2),
  post_weight DECIMAL(6,2),
  start_time TEXT,
  end_time TEXT,
  notes TEXT,
  quick_notes TEXT,
  hospitalized JSONB DEFAULT '{"isHosp": false, "hospital": ""}',
  missed_tx JSONB DEFAULT '{"isMissed": false, "type": ""}',
  wheelchair_weight JSONB DEFAULT '{}',
  collapsed_sections JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PATIENT QA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patient_qa (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  pre_check BOOLEAN DEFAULT FALSE,
  thirty_min BOOLEAN DEFAULT FALSE,
  meds BOOLEAN DEFAULT FALSE,
  abx_idpn BOOLEAN DEFAULT FALSE,
  stat_labs BOOLEAN DEFAULT FALSE,
  missed_tx TEXT,
  whiteboard BOOLEAN DEFAULT FALSE,
  labs_prep BOOLEAN DEFAULT FALSE,
  ett_signed BOOLEAN DEFAULT FALSE,
  chart_closed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PATIENT TODOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patient_todos (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHECKLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checklists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHECKLIST FOLDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_folders (
  id BIGSERIAL PRIMARY KEY,
  checklist_id BIGINT REFERENCES checklists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_position INTEGER DEFAULT 0
);

-- ============================================
-- CHECKLIST ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_items (
  id BIGSERIAL PRIMARY KEY,
  folder_id BIGINT REFERENCES checklist_folders(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  url TEXT,
  order_position INTEGER DEFAULT 0
);

-- ============================================
-- CHECKLIST COMPLETIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  checklist_id BIGINT REFERENCES checklists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_items JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checklist_id, date)
);

-- ============================================
-- LABS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS labs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  patient_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SNIPPET CONFIGURATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS snippet_configurations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SNIPPET SECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS snippet_sections (
  id BIGSERIAL PRIMARY KEY,
  config_id BIGINT REFERENCES snippet_configurations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  order_position INTEGER DEFAULT 0
);

-- ============================================
-- SNIPPETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS snippets (
  id BIGSERIAL PRIMARY KEY,
  section_id BIGINT REFERENCES snippet_sections(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  tags JSONB DEFAULT '[]'
);

-- ============================================
-- APP SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  theme TEXT DEFAULT 'clinical-blue',
  technicians JSONB DEFAULT '[]',
  sections JSONB DEFAULT '{
    "B1": {"name": "B1", "chairs": [1,2,3,4,5,6,7,8], "info": ""},
    "B2": {"name": "B2", "chairs": [9,10,11,12,13,14,15,16], "info": ""},
    "A1": {"name": "A1", "chairs": [17,18,19,20,21,22,23,24], "info": ""},
    "A2": {"name": "A2", "chairs": [25,26,27,28,29,30,31,32], "info": ""},
    "TCH": {"name": "TCH", "chairs": [33,34,35,36], "info": "Wheelchair patients"}
  }',
  section_order JSONB DEFAULT '["B1", "B2", "A1", "A2", "TCH"]',
  auto_save_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_shift ON patients(shift);
CREATE INDEX IF NOT EXISTS idx_patients_section ON patients(section);
CREATE INDEX IF NOT EXISTS idx_patients_pod ON patients(pod);
CREATE INDEX IF NOT EXISTS idx_patient_qa_patient_id ON patient_qa(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_todos_patient_id ON patient_todos(patient_id);
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_folders_checklist_id ON checklist_folders(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_folder_id ON checklist_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_user_date ON checklist_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_labs_user_id ON labs(user_id);
CREATE INDEX IF NOT EXISTS idx_snippet_configs_user_id ON snippet_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_snippet_sections_config_id ON snippet_sections(config_id);
CREATE INDEX IF NOT EXISTS idx_snippets_section_id ON snippets(section_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Patients policies
CREATE POLICY "Users can view their own patients"
  ON patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients"
  ON patients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients"
  ON patients FOR DELETE
  USING (auth.uid() = user_id);

-- Patient QA policies (inherit from patients)
CREATE POLICY "Users can view QA for their patients"
  ON patient_qa FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_qa.patient_id AND patients.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert QA for their patients"
  ON patient_qa FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_qa.patient_id AND patients.user_id = auth.uid()
  ));

CREATE POLICY "Users can update QA for their patients"
  ON patient_qa FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_qa.patient_id AND patients.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete QA for their patients"
  ON patient_qa FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_qa.patient_id AND patients.user_id = auth.uid()
  ));

-- Patient Todos policies (inherit from patients)
CREATE POLICY "Users can view todos for their patients"
  ON patient_todos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_todos.patient_id AND patients.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert todos for their patients"
  ON patient_todos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_todos.patient_id AND patients.user_id = auth.uid()
  ));

CREATE POLICY "Users can update todos for their patients"
  ON patient_todos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_todos.patient_id AND patients.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete todos for their patients"
  ON patient_todos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_todos.patient_id AND patients.user_id = auth.uid()
  ));

-- Checklists policies
CREATE POLICY "Users can view their own checklists"
  ON checklists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklists"
  ON checklists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklists"
  ON checklists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklists"
  ON checklists FOR DELETE
  USING (auth.uid() = user_id);

-- Checklist folders policies (inherit from checklists)
CREATE POLICY "Users can view folders for their checklists"
  ON checklist_folders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM checklists WHERE checklists.id = checklist_folders.checklist_id AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert folders for their checklists"
  ON checklist_folders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM checklists WHERE checklists.id = checklist_folders.checklist_id AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can update folders for their checklists"
  ON checklist_folders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM checklists WHERE checklists.id = checklist_folders.checklist_id AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete folders for their checklists"
  ON checklist_folders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM checklists WHERE checklists.id = checklist_folders.checklist_id AND checklists.user_id = auth.uid()
  ));

-- Checklist items policies (inherit from folders)
CREATE POLICY "Users can view items for their checklist folders"
  ON checklist_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM checklist_folders
    JOIN checklists ON checklists.id = checklist_folders.checklist_id
    WHERE checklist_folders.id = checklist_items.folder_id AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert items for their checklist folders"
  ON checklist_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM checklist_folders
    JOIN checklists ON checklists.id = checklist_folders.checklist_id
    WHERE checklist_folders.id = checklist_items.folder_id AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items for their checklist folders"
  ON checklist_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM checklist_folders
    JOIN checklists ON checklists.id = checklist_folders.checklist_id
    WHERE checklist_folders.id = checklist_items.folder_id AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items for their checklist folders"
  ON checklist_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM checklist_folders
    JOIN checklists ON checklists.id = checklist_folders.checklist_id
    WHERE checklist_folders.id = checklist_items.folder_id AND checklists.user_id = auth.uid()
  ));

-- Checklist completions policies
CREATE POLICY "Users can view their own checklist completions"
  ON checklist_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist completions"
  ON checklist_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist completions"
  ON checklist_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist completions"
  ON checklist_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Labs policies
CREATE POLICY "Users can view their own labs"
  ON labs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own labs"
  ON labs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own labs"
  ON labs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own labs"
  ON labs FOR DELETE
  USING (auth.uid() = user_id);

-- Snippet configurations policies
CREATE POLICY "Users can view their own snippet configs"
  ON snippet_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snippet configs"
  ON snippet_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snippet configs"
  ON snippet_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snippet configs"
  ON snippet_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- Snippet sections policies (inherit from configs)
CREATE POLICY "Users can view sections for their snippet configs"
  ON snippet_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM snippet_configurations WHERE snippet_configurations.id = snippet_sections.config_id AND snippet_configurations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sections for their snippet configs"
  ON snippet_sections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM snippet_configurations WHERE snippet_configurations.id = snippet_sections.config_id AND snippet_configurations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sections for their snippet configs"
  ON snippet_sections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM snippet_configurations WHERE snippet_configurations.id = snippet_sections.config_id AND snippet_configurations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sections for their snippet configs"
  ON snippet_sections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM snippet_configurations WHERE snippet_configurations.id = snippet_sections.config_id AND snippet_configurations.user_id = auth.uid()
  ));

-- Snippets policies (inherit from sections)
CREATE POLICY "Users can view snippets for their sections"
  ON snippets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM snippet_sections
    JOIN snippet_configurations ON snippet_configurations.id = snippet_sections.config_id
    WHERE snippet_sections.id = snippets.section_id AND snippet_configurations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert snippets for their sections"
  ON snippets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM snippet_sections
    JOIN snippet_configurations ON snippet_configurations.id = snippet_sections.config_id
    WHERE snippet_sections.id = snippets.section_id AND snippet_configurations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update snippets for their sections"
  ON snippets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM snippet_sections
    JOIN snippet_configurations ON snippet_configurations.id = snippet_sections.config_id
    WHERE snippet_sections.id = snippets.section_id AND snippet_configurations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete snippets for their sections"
  ON snippets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM snippet_sections
    JOIN snippet_configurations ON snippet_configurations.id = snippet_sections.config_id
    WHERE snippet_sections.id = snippets.section_id AND snippet_configurations.user_id = auth.uid()
  ));

-- App settings policies
CREATE POLICY "Users can view their own settings"
  ON app_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON app_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON app_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON app_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_qa_updated_at BEFORE UPDATE ON patient_qa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_completions_updated_at BEFORE UPDATE ON checklist_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA SEEDING (Optional)
-- ============================================

-- This will create default settings for new users automatically
-- You can remove this if you prefer to handle it in your app

-- Note: This is just the schema. Initial user data should be created
-- when they first log in through your application.
