# HDFlowsheet React Migration Plan

## Architecture Overview

### Component Structure
```
src/
├── components/
│   ├── charting/
│   │   ├── PatientTabs.jsx          # Patient tab navigation
│   │   ├── PatientCard.jsx          # Individual patient flowsheet
│   │   ├── QAChecklist.jsx          # QA checklist grid
│   │   ├── QuickChart.jsx           # Quick chart modal
│   │   ├── QuickAssign.jsx          # Bulk assignment modal
│   │   ├── QuickNotes.jsx           # Floating notes panel
│   │   └── TechCheckSection.jsx    # Missing items checker
│   ├── operations/
│   │   ├── ChecklistsTab.jsx        # Checklists management
│   │   ├── LabsTab.jsx              # Labs tracking
│   │   └── SnippetsTab.jsx          # Snippets manager
│   ├── reports/
│   │   └── EOSRReport.jsx           # End of shift report
│   ├── common/
│   │   ├── Modal.jsx                # Reusable modal component
│   │   ├── FloatingNav.jsx          # Left sidebar navigation
│   │   ├── ThemeSelector.jsx       # Theme picker
│   │   └── ImportExcel.jsx          # Excel file upload
│   └── layout/
│       ├── MainLayout.jsx           # Top-level layout
│       └── FloatingActions.jsx      # FAB stack
├── contexts/
│   ├── PatientContext.jsx           # Patient state management
│   ├── OperationsContext.jsx        # Operations state
│   ├── SnippetContext.jsx           # Snippets state
│   └── ThemeContext.jsx             # Theme management
├── hooks/
│   ├── useLocalStorage.js           # LocalStorage sync
│   ├── useSupabase.js               # Supabase operations
│   ├── useAutoSave.js               # Auto-save interval
│   └── useExcelImport.js            # Excel parsing
├── utils/
│   ├── excelParser.js               # Excel data extraction
│   ├── reportGenerator.js           # EOSR logic
│   └── calculations.js              # UF, weight calculations
└── styles/
    └── themes.css                   # CSS variables for themes
```

### State Management Strategy

**React Context API** for global state:
- `PatientContext`: Patient data, active patient, pod/shift/section filters
- `OperationsContext`: Checklists, labs, completion tracking
- `SnippetContext`: Snippet configurations, active config
- `ThemeContext`: Current theme, technician list

**Custom Hooks** for side effects:
- `useLocalStorage`: Sync state to localStorage
- `useSupabase`: CRUD operations with Supabase
- `useAutoSave`: Interval-based persistence

### Supabase Database Schema

#### Tables

**1. patients**
```sql
CREATE TABLE patients (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,  -- Multi-user support
  name TEXT NOT NULL,
  chair INTEGER,
  tech TEXT,
  pod TEXT,
  section TEXT,
  shift TEXT,
  dry_weight DECIMAL,
  pre_weight DECIMAL,
  goal_uf DECIMAL,
  post_weight DECIMAL,
  start_time TEXT,
  end_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. patient_qa**
```sql
CREATE TABLE patient_qa (
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
```

**3. patient_todos**
```sql
CREATE TABLE patient_todos (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4. checklists**
```sql
CREATE TABLE checklists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  order_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**5. checklist_folders**
```sql
CREATE TABLE checklist_folders (
  id BIGSERIAL PRIMARY KEY,
  checklist_id BIGINT REFERENCES checklists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_position INTEGER
);
```

**6. checklist_items**
```sql
CREATE TABLE checklist_items (
  id BIGSERIAL PRIMARY KEY,
  folder_id BIGINT REFERENCES checklist_folders(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  url TEXT,
  order_position INTEGER
);
```

**7. checklist_completions**
```sql
CREATE TABLE checklist_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  checklist_id BIGINT REFERENCES checklists(id),
  date DATE NOT NULL,
  completed_items JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checklist_id, date)
);
```

**8. labs**
```sql
CREATE TABLE labs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  patient_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**9. snippet_configurations**
```sql
CREATE TABLE snippet_configurations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  order_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**10. snippet_sections**
```sql
CREATE TABLE snippet_sections (
  id BIGSERIAL PRIMARY KEY,
  config_id BIGINT REFERENCES snippet_configurations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  order_position INTEGER
);
```

**11. snippets**
```sql
CREATE TABLE snippets (
  id BIGSERIAL PRIMARY KEY,
  section_id BIGINT REFERENCES snippet_sections(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  tags JSONB DEFAULT '[]'
);
```

**12. app_settings**
```sql
CREATE TABLE app_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  theme TEXT DEFAULT 'clinical-blue',
  technicians JSONB DEFAULT '[]',
  sections JSONB DEFAULT '{}',
  auto_save_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration Approach

**Phase 1: Foundation** ✓ (Current)
- Set up component structure
- Create context providers
- Build basic layout and navigation

**Phase 2: Core Features**
- Patient charting UI
- QA checklist implementation
- Basic CRUD operations

**Phase 3: Operations Module**
- Checklists management
- Labs tracking
- Snippets system

**Phase 4: Advanced Features**
- Excel import/export
- Reports generation
- Theme system

**Phase 5: Data Persistence**
- Supabase integration
- Auto-save functionality
- LocalStorage backup

**Phase 6: Polish**
- Drag-and-drop
- Responsive design
- Bug fixes and testing

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.x",
    "xlsx": "^0.20.3",
    "react-beautiful-dnd": "^13.1.1",
    "date-fns": "^2.30.0"
  }
}
```

### Design Decisions

1. **State Management**: React Context (not Redux/Zustand) for simplicity
2. **Styling**: Keep existing CSS approach with CSS variables
3. **Routing**: React Router for tab navigation (optional, can use state)
4. **Forms**: Controlled components with onChange handlers
5. **Data Sync**: Optimistic UI updates + background Supabase sync
6. **Security**: Row-level security (RLS) for multi-user support

### Breaking Changes from Original

1. **PHP Backend → Supabase**: Complete backend replacement
2. **Single HTML → React Components**: Modular component architecture
3. **Server Backups → Supabase History**: Use Supabase versioning
4. **Global State → Context API**: Structured state management

### Migration Checklist

- [ ] Copy CSS and themes to React
- [ ] Extract JavaScript functions to utils
- [ ] Build component tree
- [ ] Implement contexts
- [ ] Create Supabase tables
- [ ] Wire up data persistence
- [ ] Migrate Excel import logic
- [ ] Implement all modals
- [ ] Add drag-and-drop
- [ ] Test all workflows
