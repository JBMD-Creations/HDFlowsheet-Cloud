# HDFlowsheet Complete Reference - DO NOT DELETE THESE FEATURES

**Source:** https://github.com/JBMD-Creations/HDFlowsheet/blob/main/index.html

This document serves as the authoritative reference for the entire HDFlowsheet application structure.
When in doubt, ALWAYS refer to this document and the original HDFlowsheet repository.

---

## Table of Contents
1. [Main Navigation](#1-main-navigation)
2. [Patient Charting Page](#2-patient-charting-page)
3. [Operations Page](#3-operations-page)
4. [Reports Page](#4-reports-page)
5. [Modals & Dialogs](#5-modals--dialogs)
6. [Snippet System](#6-snippet-system)
7. [Data Persistence](#7-data-persistence)

---

## 1. Main Navigation

### Floating Navigation (Left Sidebar)
```
floating-nav-wrapper
├── floating-nav
│   ├── Pt Charting Section
│   │   └── 📊 Pt Charting (floatNavCharting)
│   │
│   ├── Operations Section
│   │   ├── ⚙️ Operations (floatNavOperations)
│   │   ├── 📋 Checklists (floatNavChecklists) [sub-nav]
│   │   ├── 🧪 Labs (floatNavLabs) [sub-nav]
│   │   └── ✂️ Snippets (floatNavSnippets) [sub-nav]
│   │
│   ├── Reports Section
│   │   ├── 📈 Reports (floatNavReports)
│   │   └── 📋 End of Shift Report (floatNavEOSR) [sub-nav]
│   │
│   └── Save Section
│       └── 💾 Save / Auto-save indicator
│
└── floating-nav-toggle (collapse/expand button)
```

---

## 2. Patient Charting Page

### Page Structure
```
pt-charting-page
├── shift-tabs-container (AM/PM shift selection)
├── pod-tabs (Pod A, Pod B, etc.)
├── patient-tabs-container
│   └── patient-tabs (individual patient tabs with indicators)
├── patient-list (patient cards container)
└── drawer-panel (Snippet Builder - slides in from right, NO overlay)
```

### Floating Buttons (Top-Right Corner)
**CRITICAL:** These buttons are FIXED position in top-right, stacked VERTICALLY.

```
floating-buttons (position: fixed, right: 20px, top: 20px)
├── 📋 Charting    → toggles drawer-panel
├── 👥 Quick Assign → opens bulk assign modal
├── 📝 Quick Notes  → opens quick notes modal
└── 💾 Save All     → saves all data
```

**CSS Structure:**
```css
.floating-buttons {
  position: fixed;
  right: 20px;
  top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 999;
}

.floating-btn {
  background: #5B9BD5;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 700;
}
```

### Drawer Panel (NOT an overlay)
The drawer slides in from the right and does NOT block the main content.
Users can still interact with patient cards while the drawer is open.

```
drawer-panel (position: fixed, right: -500px → 0 when open)
├── drawer-header
│   ├── drawer-title (📋 Charting Snippet Builder)
│   └── drawer-close-btn (×)
└── drawer-body
    ├── generated-snippet-display (sticky)
    ├── pinned-snippet (Access visible and secure...)
    └── snippet-categories (collapsible)
```

### Patient Card Structure
Each patient card contains these collapsible sections IN ORDER:

| Order | Section | Data Section ID | Description |
|-------|---------|-----------------|-------------|
| 1 | At a Glance | (header) | Patient name, status badges, quick info |
| 2 | Tech Check | techcheck | Missing items checklist |
| 3 | QA Checklist | qa | Pre-check boxes, Misc To-Do, Labs |
| 4 | Assignment | assignment | Chair, RN, Tech assignments |
| 5 | Treatment Orders | orders | Treatment parameters |
| 6 | Weight & UF | weight | Weight tracking, wheelchair section |
| 7 | Time Documentation | time | Start/end times, timestamps |

### QA Checklist Section (5-Column Grid)
```
qa-boxes-grid (5 columns)
├── Pre Check (qa-main-item)
│   ├── Machine Check
│   ├── Pre Dialysis
│   └── Order Verify
│
├── Meds Due (qa-main-item)
│   ├── Meds Given
│   └── Documented
│
├── Misc Toggle (qa-main-item)
│   ├── 30 Min Check
│   ├── Abx/IDPN
│   ├── STAT Labs
│   └── Labs Prep
│
├── Hosp Days (qa-main-item)
│   └── Days input field
│
└── Missed Tx (qa-main-item)
    └── Treatments input field
```

### Misc To-Do List Section
```
misc-todo-section
├── misc-todo-header (collapsible)
├── misc-todo-content
│   ├── Add To-Do input
│   ├── Snippet buttons:
│   │   ├── Access assessment chart
│   │   ├── Foot check
│   │   ├── Monthly/Daily progress note
│   │   ├── Notify MD/NP
│   │   └── PHN Call
│   ├── To Do list (incomplete items)
│   └── Complete list (completed items)
└── Chart Closed checkbox
```

### STAT Labs Section (in QA)
```
labs-section
├── labs-title (🧪 STAT Labs)
├── labs-snippet-buttons
│   ├── BMP - 2+ Missed Tx
│   ├── BMP - Muscle Cramps
│   ├── CBC - Bleeding
│   ├── PT/INR
│   └── Custom lab input
└── labs-list (added labs)
```

### Wheelchair Weight Section (for TCH patients)
```
wheelchair-section
├── wheelchair-header (toggle)
└── wheelchair-content
    ├── wheelchair-items-section (equipment list)
    └── wheelchair-columns
        ├── pre-column
        │   ├── Measured weight input
        │   ├── Equipment checkboxes
        │   ├── WC Weight (calculated)
        │   └── Actual Pt Wt (calculated)
        └── post-column
            ├── Measured weight input
            ├── Equipment checkboxes
            │   └── Actual Pt Wt (calculated)
```

### Patient Tab Indicators
Each patient tab shows status badges:
- ⚖️ Weight deviation
- ⏱️ Time short
- ✍️ ETT needed
- 🏥 Hospitalized (yellow background)
- ❌ Missed Tx (red background)
- ✅ Chart Closed (green checkmark)

---

## 3. Operations Page

### Page Structure
```
operations-page
├── ops-header
│   ├── ops-title (⚙️ Operations)
│   └── ops-actions (Export/Import buttons)
│
├── ops-sub-tabs (3 TABS - ALL REQUIRED)
│   ├── 📋 Checklists (opsSubTabChecklists) ← REQUIRED
│   ├── 🧪 Labs (opsSubTabLabs) ← REQUIRED
│   └── ✂️ Snippets (opsSubTabSnippets) ← REQUIRED
│
└── ops-sub-content
    ├── opsChecklistsContent
    ├── opsLabsContent
    └── opsSnippetsContent
```

### Checklists Sub-Tab
```
opsChecklistsContent
├── checklist-tabs-container
│   ├── checklist-tabs (draggable tabs)
│   └── + Create Checklist button
└── checklist-content
    └── checklist-items (checkbox items)
```

### Labs Sub-Tab
```
opsLabsContent
├── labs-add-section
│   ├── Patient selector
│   ├── Lab type input
│   └── Add button
└── labs-list
    └── lab-entries (with timestamp)
```

### Snippets Sub-Tab
```
opsSnippetsContent
├── snippet-config-header
│   ├── + New Configuration button
│   ├── Export button
│   └── Import button
│
├── snippet-config-tabs-container
│   ├── snippet-config-tabs (draggable config tabs)
│   └── + Add button
│
└── snippet-config-content
    └── snippet-section-cards (for each section)
        ├── snippet-section-card-header
        │   ├── Icon + Section Name
        │   ├── Snippet count badge
        │   └── Edit/Delete buttons
        └── snippet-section-card-body
            ├── snippet-items-list
            │   └── snippet-item (text, tags, actions)
            └── + Add Snippet button
```

---

## 4. Reports Page

### Page Structure
```
reports-page
├── reports-header
│   └── reports-title (📊 Reports)
│
├── reports-tabs
│   └── 📋 End of Shift Report (reportTabEOSR)
│
└── reports-content
    └── eosr-container
```

### End of Shift Report (EOSR) Sections
ALL 14 sections required:

| # | Section | Content ID | Description |
|---|---------|------------|-------------|
| 1 | Treatments Complete Without Issue | eosrCompleteContent | Patients who completed normally |
| 2 | COVID-19 Presumptive | eosrCovidContent | COVID-positive patients |
| 3 | Weight Deviation | eosrWeightContent | Over/under 1.5kg of dry weight |
| 4 | Early Termination | eosrEarlyTermContent | Treatments ended early |
| 5 | Missed Treatments | eosrMissedContent | Missed treatment count |
| 6 | Medications Rescheduled | eosrMedsContent | Meds that were rescheduled |
| 7 | STAT Labs | eosrStatLabsContent | Emergency lab orders |
| 8 | Sent to ED/Hospital | eosrSentOutContent | Patients sent out |
| 9 | Hospitalization | eosrHospContent | Currently hospitalized |
| 10 | Welfare Check | eosrWelfareContent | Welfare check needed |
| 11 | New Patients | eosrNewPtsContent | New patient intakes |
| 12 | MIDAS Report | eosrMidasContent | MIDAS reports created |
| 13 | Access Complications | eosrAccessContent | Access issues |
| 14 | Disinfection Logs | eosrDisinfectContent | Machine disinfection status |

### EOSR Section Structure
```
eosr-section
├── eosr-section-header
│   ├── Section title
│   └── eosr-section-count (patient count badge)
└── eosr-section-content
    └── Patient entries or bullet placeholder
```

---

## 5. Modals & Dialogs

### Required Modals
| Modal | ID | Purpose |
|-------|-----|---------|
| Checklist Editor | checklistEditorModal | Create/edit checklists |
| Snippet Config | snippetConfigModal | Create/edit snippet configurations |
| Snippet Section | snippetSectionModal | Create/edit snippet sections |
| Snippet Item | snippetItemModal | Create/edit individual snippets |
| Quick Notes | quick-notes-modal | Per-patient notes |
| Timestamp | timestampModal | Add timestamps to time documentation |
| Import | importModal | Import patient data |

---

## 6. Snippet System

### Drawer Panel (Snippet Builder)
Location: Right side panel in Patient Charting

```
drawer-panel
├── drawer-header
│   ├── drawer-title (📋 Charting Snippet Builder)
│   └── drawer-close-btn
│
└── drawer-body
    ├── generated-snippet-display (STICKY)
    │   ├── Generated Note text area
    │   ├── Copy to Clipboard button
    │   └── Clear button
    │
    ├── Pinned Quick Access Snippet
    │   └── "Access visible and secure. Care ongoing." (GREEN)
    │
    ├── Tag Filter Section
    │   └── Tag buttons for filtering
    │
    └── Snippet Categories (collapsible)
        └── [9 sections with snippets]
```

### Snippet Sections (9 Required)
| # | Section | Icon | Snippet Count |
|---|---------|------|---------------|
| 1 | Weight & UF Management | ⚖️ | 1 |
| 2 | Pre Dialysis | 🏥 | 5 |
| 3 | Treatment Initiated | 💉 | 4 |
| 4 | During Treatment | ⏱️ | 2 |
| 5 | Hypertension Management | 🔴 | 7 |
| 6 | Hypotension Management | 🔵 | 12 |
| 7 | No Changes / Stable | ✅ | 8 |
| 8 | Access & Lines | 🩸 | 6 |
| 9 | Fluid Management | 💧 | 7 |

### Weight & UF Calculator (in Weight section)
```
weight-calculator
├── Pre Weight input (kg)
├── Dry Weight input (kg)
├── Pre Over DW (auto-calculated: Pre - Dry)
├── UF Goal (auto-calculated: Pre Over DW + 0.4)
└── Target Weight (auto-calculated: Pre - UF Goal)
```

### BFR & UF Sliders (in Treatment Initiated section)
```
sliders-section
├── Blood Flow Rate slider (200-500, step 10)
└── UF Goal slider (0-6 kg, step 0.1)
```

### All 52 Snippets

#### Weight & UF Management (1)
1. Pt denies any pains / SOB. No other voiced concerns.

#### Pre Dialysis (5)
1. Weight and goal reviewed and verified with pt.
2. Pt denies any pains / SOB. No other voiced concerns.
3. 5 mg Midodrine given for BP support.
4. T to 36.5 for BP support.
5. T to 36.0 for BP support.

#### Treatment Initiated (4)
1. Treatment initiated per orders. BFR [BFR], UF goal [UF Goal].
2. Pt tolerated treatment initiation without complaint.
3. Access cannulated without difficulty.
4. Good arterial/venous flow noted.

#### During Treatment (2)
1. Pt experiencing cramping.
2. UF to minimum.

#### Hypertension Management (7)
1. Pt BP elevated.
2. Pt denies any chest pain, SOB, dizziness or headache.
3. Pt reports taking his BP meds before tx.
4. 0.1 mg clonidine given for BP support.
5. BP stabilized after intervention.
6. Will continue to monitor BP closely.
7. T to 37 for BP support.

#### Hypotension Management (12)
1. Pt experiencing hypotension during treatment.
2. Pt BP low side.
3. Pt experienced > 20 pt SBP drop.
4. Pt experiencing side effects d/t hypotension - dizzy / light headedness.
5. Pt denies any s/s of hypotension such as light headedness, chest pain or SOB.
6. 5 mg Midodrine given for BP support.
7. 100mL NS bolus given for BP support.
8. BP stabilized, treatment continued.
9. UF to min for BP support.
10. T to 36.5 for BP support.
11. T already at 36.0.
12. MAP remains > 70.

#### No Changes / Stable (8)
1. Pt stable throughout treatment.
2. No complaints voiced.
3. Tolerating treatment well without intervention.
4. VS within normal limits.
5. No changes / Stable.
6. Pt resting comfortably in chair watching TV.
7. Pt resting comfortably in chair playing with phone.
8. Pt sleeping comfortably with head back and legs elevated. Chest rising and falling appropriately. No signs of distress.

#### Access & Lines (6)
1. Fistula assessment: good thrill and bruit noted.
2. Graft assessment: patent, no signs of infection.
3. Catheter site clean, dry, intact.
4. Dressing changed per protocol.
5. No signs of bleeding or hematoma at access site.
6. Good hemostasis achieved post-treatment.

#### Fluid Management (7)
1. IDWG within acceptable range.
2. Significant IDWG noted, fluid restriction education reinforced.
3. UF goal met without difficulty.
4. Pt reports improved adherence to fluid restriction.
5. Dietitian consult recommended for fluid management.
6. Signs/symptoms of fluid overload: SOB, edema, JVD.
7. Post-treatment weight at/near dry weight.

---

## 7. Data Persistence

### LocalStorage Keys
| Key | Purpose |
|-----|---------|
| `hd_patients` | Patient data |
| `hd_checklists` | Operations checklists |
| `hd_labs` | Lab entries |
| `hd_snippet_data` | Snippet configurations |
| `hd-snippet-configs` | Snippet configs (React version) |
| `hd-active-snippet-config` | Active config ID |
| `hd_section_order` | Collapsible section order |
| `hd_theme` | Theme preference |

### Supabase Tables (for cloud sync)
| Table | Purpose |
|-------|---------|
| `patients` | Patient records |
| `checklist_configurations` | Checklist templates |
| `checklist_items` | Individual checklist items |
| `snippet_configurations` | Snippet config sets |
| `snippet_sections` | Snippet categories |
| `snippets` | Individual snippet texts |
| `labs` | Lab entries |

---

## Critical Feature Checklist

Before making ANY changes, verify these features exist:

### Navigation
- [ ] Floating nav with Charting, Operations, Reports
- [ ] Operations sub-nav: Checklists, Labs, Snippets
- [ ] Reports sub-nav: EOSR

### Patient Charting
- [ ] Pod tabs
- [ ] Patient tabs with status indicators
- [ ] 7 collapsible sections per patient
- [ ] QA 5-column grid (Pre Check, Meds, Misc, Hosp, Missed)
- [ ] Misc To-Do list with snippets
- [ ] STAT Labs section
- [ ] Wheelchair weight section
- [ ] Drawer panel (Snippet Builder)

### Operations Page
- [ ] 3 tabs: Checklists, Labs, Snippets
- [ ] Draggable checklist tabs
- [ ] Labs add/list functionality
- [ ] Snippet configuration tabs
- [ ] Snippet section cards with items

### Reports Page
- [ ] EOSR with 14 sections
- [ ] Refresh and Copy buttons
- [ ] Patient count badges

### Snippet Builder
- [ ] Pinned "Access visible and secure. Care ongoing."
- [ ] 9 snippet sections
- [ ] 52 total snippets
- [ ] Weight calculator
- [ ] BFR/UF sliders
- [ ] Tag filtering
- [ ] Copy to clipboard

---

## Reference Source

**Original HDFlowsheet Repository:**
https://github.com/JBMD-Creations/HDFlowsheet

**Main HTML File:**
https://raw.githubusercontent.com/JBMD-Creations/HDFlowsheet/main/index.html

When implementing features, ALWAYS check the original source for exact structure and styling.
