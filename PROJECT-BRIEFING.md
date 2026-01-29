# HDFlowsheet Project Briefing

> **Single-file reference for onboarding AI assistants or new developers to this project.**

---

## Quick Links

| Resource | URL |
|----------|-----|
| **Repository** | `https://github.com/JBMD-Creations/HDFlowsheet-Cloud` |
| **Architecture Diagram** | [View Interactive](https://htmlpreview.github.io/?https://github.com/JBMD-Creations/HDFlowsheet-Cloud/blob/main/app-architecture.html) |
| **Style Guide** | [View Interactive](https://htmlpreview.github.io/?https://github.com/JBMD-Creations/HDFlowsheet-Cloud/blob/main/styleguide.html) |

---

## 1. Project Overview

**HDFlowsheet** is a hemodialysis (HD) patient management and QA tracking system for dialysis clinics.

### Purpose
- Manage patient flowsheets during dialysis treatments
- Track operations checklists for daily clinic tasks
- Generate End of Shift Reports (EOSR)
- Quality assurance tracking and documentation

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JavaScript, Single HTML file (`index.html`) |
| Backend | Vercel Serverless Functions |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT) |

### Architecture Pattern
**Offline-first with cloud sync.** LocalStorage provides immediate access; Supabase provides persistence and multi-device sync via JWT authentication.

---

## 2. Core Modules

### Patient Charting
- Import patients from Excel
- Assign technicians/pods
- Manage QA checklists per patient
- Track treatments and document notes

### Operations
- Daily checklists with folders
- Lab tracking
- Snippet templates for quick text insertion
- Drag-reorderable items with URL link support

### Reports
- End of Shift Reports (EOSR)
- Editable summaries
- Drag-reorderable patient sections

### Settings
- Theme selection
- Section management
- Technician setup
- Developer tools
- Import/export functionality

---

## 3. Data Flow

```
Browser (index.html)
    │
    ▼ fetch()
Vercel API (/api/load, /api/save, /api/checklists, /api/labs)
    │
    ▼ SQL
Supabase (PostgreSQL + Auth + RLS Policies)
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/load` | Load patient flowsheet data |
| POST | `/api/save` | Save patient flowsheet data |
| GET/POST | `/api/checklists` | Load/save operations checklists |
| GET/POST | `/api/labs` | Load/save lab tracking data |

---

## 4. Database Schema

### Physical Tables

| Table | Purpose |
|-------|---------|
| `app_data` | JSONB document storage for flowsheet/patient data per user |
| `checklists` | Operations checklist definitions |
| `checklist_folders` | Folders for organizing checklists |
| `checklist_items` | Individual items within checklists |
| `checklist_completions` | Completion status tracking by date |
| `labs` | Lab tracking entries |

### Data Types (stored in `app_data` JSONB)

The `app_data` table stores a JSONB column containing:
- `patients[]` - Patient records with assignments and QA checklists
- `technicians[]` - Technician definitions
- `snippets[]` - Quick-insert text templates
- `timestamp_logs[]` - Audit trail for changes
- `section_order[]` - UI section ordering preferences

---

## 5. State Objects

### Main State (`state`)
```javascript
{
  patients: [],           // Array of patient objects
  activeShift: 1,         // Current shift filter (1, 2, or 3)
  techs: [],              // Technician list
  activePatientId: null,  // Currently selected patient
  // ... additional UI state
}
```

### Operations State (`opsState`)
```javascript
{
  checklists: [],         // Array of checklist objects
  completions: {},        // Completion status by date
  loadedFromServer: false // Critical flag - prevents saving before load
}
```

---

## 6. Development Guidelines

### Before Making Major Changes

**Always trace the existing flow first.** Before adding auth, state management, or any feature that touches initialization:

1. Explain exactly what happens on page load, step by step
2. Identify which CSS classes control visibility (e.g., `.main-app.active`)
3. Understand how modals, containers, and pages show/hide
4. Document the flow before writing any code

### Common Gotchas

| Issue | Cause |
|-------|-------|
| Blank screen | `.main-app` missing `.active` class |
| Patient charting page blank | `.pt-charting-page` missing `.active` class |
| Patients not displaying | `state.activeShift` doesn't match patient `shift` property |
| UI not updating | `renderAll()` not called after data loads |

### Debugging Priority Order

1. **DOM visibility first** - before assuming data issues
2. **CSS class states** - check for missing `.active` classes
3. **Parent container visibility** - hidden parent hides all children
4. **Data state second** - only after confirming DOM structure is correct

### UI Debugging Checklist

```javascript
// 1. Is the HTML generated?
document.querySelector('.target-element')?.innerHTML?.substring(0, 200)

// 2. Is it visible in the DOM?
document.querySelector('.target-element')?.classList

// 3. What CSS is hiding it?
let el = document.querySelector('.target-element');
while (el && el !== document.body) {
    const s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
        console.log('HIDDEN:', el.className, s.display, s.visibility);
    }
    el = el.parentElement;
}

// 4. Check computed styles for a specific element
const targetEl = document.querySelector('.target-element');
const styles = window.getComputedStyle(targetEl);
console.log('display:', styles.display, 'visibility:', styles.visibility, 'height:', styles.height);
```

---

## 7. Widget System

The app uses a modular widget system. **All widgets must have consistent capabilities.**

### Required Widget Capabilities

Every widget MUST include:
1. **Drag handle** (`widget-drag-handle`) - for reordering
2. **Delete button** (`widget-delete-btn`) - for removal
3. **Editable content** - use `contenteditable="true"` where appropriate

### Widget Types

| Widget | Class | Capabilities |
|--------|-------|--------------|
| Checklist Card | `.checklist-card` | Drag, delete, collapse, edit mode, item reordering |
| Check Off Widget | `.widget-checkoff` | Drag, delete, toggle checked state |
| Data Widget | `.widget-data` | Drag, delete, editable label/value |
| Form Widget | `.widget-form` | Drag, delete, editable title/fields |
| Section Divider | `.widget-divider` | Drag, delete, editable text |
| Reminder/Alert Bar | `.widget-reminder` | Drag, delete, editable text, color variants |

### Reminder Bar Colors

```html
<div class="widget-reminder info">...</div>
<div class="widget-reminder success">...</div>
<div class="widget-reminder warning">...</div>
<div class="widget-reminder error">...</div>
```

### Grid Layouts

```html
<div class="widget-grid cols-2"><!-- 2 columns --></div>
<div class="widget-grid cols-3"><!-- 3 columns --></div>
```

Full-width widgets (`.widget-full`, `.widget-divider`, `.widget-reminder`) automatically span all columns.

---

## 8. Design System

### CSS Variables

```css
:root {
    /* Colors */
    --primary: #3b82f6;
    --primary-hover: #2563eb;
    --secondary: #f3f4f6;
    --destructive: #ef4444;
    --success: #22c55e;
    --warning: #f59e0b;

    /* Typography */
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

    /* Spacing */
    --spacing-1: 0.25rem;  /* 4px */
    --spacing-2: 0.5rem;   /* 8px */
    --spacing-4: 1rem;     /* 16px */
    --spacing-6: 1.5rem;   /* 24px */

    /* Border Radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

---

## 9. Creating Mockups

1. **Follow the styleguide** - Use `styleguide.html` as design reference
2. **Place in project root** - Name as `feature-name-mockup.html`
3. **Register in Developer Tools** - Add to settings modal in `index.html`

### Existing Mockups

| File | Description |
|------|-------------|
| `styleguide.html` | Design system reference |
| `inpatient-mockup.html` | Inpatient dialysis flowsheet |
| `inpatient-integration-mockup.html` | Integration design |
| `react-dnd-mockup.html` | Drag-and-drop comparison |

---

## 10. Known Bugs & Patterns

### BUG-001: Checklist Data Loss (FIXED)

**Root Cause:** Early return on 404 in `autoLoadFromServer()` skipped checklist loading when no patient data existed.

**Key Fix:** Added `loadedFromServer` flag to prevent saving empty data before server load completes.

**Pattern to Watch For:**
- Functions that load multiple data types sequentially
- Functions handling 404 as "no data" vs "error"
- Auto-save running before data loads

**Key Principle:** Checklists are stored separately from patient data. Loading one should never depend on the other existing.

---

## 11. Local Storage Keys

| Key | Purpose |
|-----|---------|
| `hd_operations_data` | Operations data (contains `checklists` and `completions` as nested properties) |
| `hd_labs_data` | Lab tracking entries |
| `hd_snippet_data` | Snippet templates |
| `hd_technicians` | Technician list |
| `hd_theme` | User theme preference |
| `hd_current_section` | Currently active section |
| `hd_section_order` | UI section ordering |
| `hd_selected_shifts` | Selected shift filters |
| `hd_timestamp_logs` | Audit trail logs |
| `hd_dev_mode` | Developer mode toggle |
| `hd_floating_nav_collapsed` | Floating nav collapsed state |
| `wheelchair_profiles` | Wheelchair patient profiles |

---

## 12. File Structure

```
HDFlowsheet-Cloud/
├── index.html              # Main application (single-file app)
├── api/
│   ├── load.js             # GET patient data
│   ├── save.js             # POST patient data
│   ├── checklists.js       # GET/POST checklists
│   └── labs.js             # GET/POST labs
├── styleguide.html         # Design system reference
├── app-architecture.html   # Interactive architecture docs
├── *-mockup.html           # Feature mockups
├── CLAUDE.md               # AI development guidelines
├── BUGS.md                 # Bug documentation
└── PROJECT-BRIEFING.md     # This file
```

---

## Quick Start for AI Assistants

1. **Clone the repo** and read this briefing
2. **For UI issues:** Check CSS classes and visibility first (see Section 6)
3. **For data issues:** Understand the state objects (see Section 5)
4. **For styling:** Reference the styleguide and CSS variables (see Section 8)
5. **For new features:** Follow widget system patterns (see Section 7)
6. **Before major changes:** Always trace the existing flow first

---

*Last updated: 2026-01-29 | Version 1.9.16*
