# Bug Documentation

This document tracks significant bugs, their root causes, and fixes for future reference.

---

## BUG-001: Checklist Data Loss Across Computers

**Date Fixed:** 2026-01-23
**Severity:** Critical
**Affected Versions:** All versions prior to fix
**Branch:** `claude/fix-checklist-persistence-asZFf`

### Symptoms

Users reported:
1. Checklists disappeared when logging in from a different computer
2. Checklists were cleared after using "Reset Patients"
3. Checklist data created on Computer A was not visible on Computer B (same account)

### Root Causes

**Three separate bugs** contributed to this issue:

#### Bug 1: Early Return on 404 in `autoLoadFromServer()`

**Location:** `index.html` lines ~12024-12080

```javascript
// BROKEN CODE:
async function autoLoadFromServer() {
    const response = await authFetch('/api/load');  // Loads PATIENT data

    if (response.status === 404) {
        showSaveStatus('No saved data found on server.', true);
        return false;  // <-- EXITED HERE, NEVER LOADED CHECKLISTS!
    }

    // ... patient data processing ...

    await loadOpsAndSnippetsFromServer();  // <-- NEVER REACHED IF 404
}
```

**Problem:** The `/api/load` endpoint returns patient data. If no patients existed on the server, it returned 404, and the function exited **before** calling `loadOpsAndSnippetsFromServer()` which loads checklists from `/api/checklists`.

**Impact:** Users with checklists but no patient data would never see their checklists load.

#### Bug 2: Same Issue in `loadFromServer()`

**Location:** `index.html` lines ~11820-11875

The manual "Load from Server" button had the identical bug - returning early on 404 before loading checklists.

#### Bug 3: Race Condition - Empty Overwrite

**Location:** `index.html` (multiple locations)

**Scenario:**
1. User logs in on new computer
2. `onAuthStateChange()` triggers `autoLoadFromServer()` after 500ms delay
3. **During those 500ms**, user switches to Operations tab
4. `loadOpsData()` loads from localStorage (empty on new computer)
5. `opsState.checklists = []`
6. User makes any change triggering `markDataChanged()`
7. Auto-save calls `saveOpsToServerAsync()`
8. **Empty checklists array overwrites server data!**

### The Fix

#### Fix 1: Always Load Checklists Regardless of Patient Data

Both `autoLoadFromServer()` and `loadFromServer()` were refactored:

```javascript
// FIXED CODE:
async function autoLoadFromServer() {
    const response = await authFetch('/api/load');

    let hasPatientData = false;

    if (response.status === 404) {
        // No patient data - that's OK, continue to load checklists
        console.log('No patient data on server, but will still load checklists');
    } else if (!response.ok) {
        throw new Error('Server error loading patient data');
    } else {
        // Process patient data...
        hasPatientData = true;
    }

    // ALWAYS load checklists, even if no patient data exists!
    await loadOpsAndSnippetsFromServer();

    renderAll();
    return true;
}
```

#### Fix 2: Added `loadedFromServer` Flag

Added a flag to `opsState` to track whether checklists have been loaded from the server:

```javascript
let opsState = {
    checklists: [],
    completions: {},
    // ... other fields ...
    loadedFromServer: false  // NEW: Prevents saving before server data loads
};
```

#### Fix 3: Save Protection

Updated `saveOpsToServerAsync()` to check the flag:

```javascript
async function saveOpsToServerAsync() {
    // CRITICAL: Prevent saving empty checklists before server data has loaded
    if (!opsState.loadedFromServer) {
        console.warn('Skipping checklist save - server data not yet loaded');
        return { success: true, skipped: true };
    }

    // Proceed with save...
}
```

#### Fix 4: Set Flag in All Load Paths

The `loadedFromServer` flag is set to `true` in all functions that load checklist data:

| Function | Purpose |
|----------|---------|
| `loadOpsAndSnippetsFromServer()` | Auto-load after login |
| `loadOpsFromServer()` | Manual "Load from Server" button |
| `restoreBackup()` | Restore from backup |
| `recoverOrphanedItems()` | Recover lost items |
| `importOpsData()` | Import from JSON file |

### Data Flow Diagrams

#### Before Fix (Broken)

```
User logs in on new computer
         │
         ▼
autoLoadFromServer()
         │
         ▼
GET /api/load (patient data)
         │
         ▼
    404 response? ──YES──▶ return false (EXIT)
         │                      │
         NO                     ▼
         │               Checklists NEVER load!
         ▼
Load patient data
         │
         ▼
loadOpsAndSnippetsFromServer()
         │
         ▼
Checklists load ✓
```

#### After Fix (Working)

```
User logs in on new computer
         │
         ▼
autoLoadFromServer()
         │
         ▼
GET /api/load (patient data)
         │
         ▼
    404 response? ──YES──▶ Continue (don't exit)
         │                      │
         NO                     │
         │                      │
         ▼                      │
Load patient data               │
         │                      │
         ▼◀─────────────────────┘
loadOpsAndSnippetsFromServer()
         │
         ▼
SET loadedFromServer = true
         │
         ▼
Checklists load ✓
```

### Files Modified

| File | Changes |
|------|---------|
| `index.html` | Added `loadedFromServer` flag, fixed early returns, added save protection |

### How to Verify the Fix

1. **Test cross-computer persistence:**
   - Create checklists on Computer A
   - Log out
   - Log in on Computer B (or use incognito/different browser)
   - Verify checklists appear

2. **Test after patient reset:**
   - Create checklists
   - Add patients
   - Use "Reset Patients"
   - Verify checklists still exist
   - Log out and back in
   - Verify checklists still exist

3. **Check console logs:**
   - On login, should see: `"Checklists loaded from server: X checklists"`
   - If no patient data: `"No patient data on server, but will still load checklists"`

### Troubleshooting

If checklists disappear again, check:

1. **Console for errors:**
   ```javascript
   // Look for these messages:
   "Skipping checklist save - server data not yet loaded"
   "Checklists loaded from server: X checklists"
   "No checklists on server, but ready to save new ones"
   ```

2. **Verify `loadedFromServer` flag:**
   ```javascript
   // In browser console:
   console.log('loadedFromServer:', opsState.loadedFromServer);
   console.log('checklists count:', opsState.checklists.length);
   ```

3. **Check backups:**
   - Settings > Developer Tools > Backup & Restore
   - Backups are created before every save
   - Use "Restore Backup" to recover lost data

4. **Check database directly:**
   - Look in Supabase `checklists` table for user's data
   - Check `checklist_items` for individual items

### Prevention

This bug pattern (early return skipping critical operations) should be watched for in:

- Any function that loads multiple data types sequentially
- Functions that handle 404 as "no data" vs "error"
- Auto-save functions that might run before data loads

**Key principle:** Checklists are stored separately from patient data. Loading one should never depend on the other existing.

---

## Template for Future Bug Documentation

```markdown
## BUG-XXX: [Title]

**Date Fixed:** YYYY-MM-DD
**Severity:** Critical/High/Medium/Low
**Affected Versions:**
**Branch:**

### Symptoms

What users reported or observed.

### Root Causes

Technical explanation of what went wrong.

### The Fix

What changes were made and why.

### Files Modified

| File | Changes |
|------|---------|

### How to Verify the Fix

Steps to confirm the bug is fixed.

### Troubleshooting

How to diagnose if the bug recurs.
```
