# Claude Development Guidelines for HDFlowsheet

## Before Making Major Changes

**Always trace the existing flow first.** Before adding auth, state management, or any feature that touches initialization:

1. Explain exactly what happens on page load, step by step
2. Identify which CSS classes control visibility (e.g., `.main-app.active`)
3. Understand how modals, containers, and pages show/hide
4. Document the flow before writing any code

## UI Debugging Checklist

When the user reports a blank screen or missing content, check in this order:

1. **Is the HTML generated?**
   ```javascript
   document.querySelector('.target-element')?.innerHTML?.substring(0, 200)
   ```

2. **Is it visible in the DOM?**
   ```javascript
   document.querySelector('.target-element')?.classList
   ```

3. **What CSS is hiding it?** Check parent containers:
   ```javascript
   let el = document.querySelector('.target-element');
   while (el && el !== document.body) {
       const s = window.getComputedStyle(el);
       if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
           console.log('HIDDEN:', el.className, s.display, s.visibility);
       }
       el = el.parentElement;
   }
   ```

4. **Check computed styles:**
   ```javascript
   const styles = window.getComputedStyle(element);
   console.log('display:', styles.display, 'visibility:', styles.visibility, 'height:', styles.height);
   ```

## Common Gotchas in This Codebase

- `.main-app` requires `.active` class to be visible
- `.pt-charting-page` requires `.active` class to be visible
- `state.activeShift` must match patient `shift` property for patients to display
- `renderAll()` must be called after data loads to update the UI

## Debugging Priorities

1. **DOM visibility first** - before assuming data issues
2. **CSS class states** - check for missing `.active` classes
3. **Parent container visibility** - a hidden parent hides all children
4. **Data state second** - only after confirming DOM structure is correct

## Creating HTML Mockups

When creating HTML mockups for the user to review:

1. **Follow the styleguide** - Always use `styleguide.html` as the design reference. Use its CSS variables, component classes, colors, spacing, and typography.

2. **Place in project root** - Save mockup files in the project root directory (e.g., `feature-mockup.html`)

3. **Register in Developer Tools** - Add new mockups to the Developer Tools section in `index.html` settings modal:
   ```html
   <div class="dev-link-item" onclick="openDevFile('your-mockup.html')">
       <span class="dev-link-icon">🎯</span>
       <div class="dev-link-info">
           <span class="dev-link-title">Your Mockup Title</span>
           <span class="dev-link-desc">Brief description</span>
       </div>
       <span class="dev-link-arrow">→</span>
   </div>
   ```

4. **Access mockups** - User can view mockups via: Settings (⚙️) → Developer Tools toggle → Click mockup link (opens in new window)

### Available Mockups

| File | Description |
|------|-------------|
| `styleguide.html` | Design system reference - colors, typography, components |
| `inpatient-mockup.html` | Inpatient dialysis flowsheet mockup |
| `react-dnd-mockup.html` | React vs SortableJS drag-and-drop comparison |

### Naming Convention

Use descriptive names with `-mockup.html` suffix: `feature-name-mockup.html`

## Widget System

The styleguide includes a modular widget system for building pages. **All widgets must have consistent capabilities.**

### Widget Capabilities (Required for ALL widgets)

Every widget type MUST include:
1. **Drag handle** (`widget-drag-handle`) - for reordering within grid
2. **Delete button** (`widget-delete-btn`) - for removing the widget
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

### Reminder Bar Color Variants

Use these classes for alert colors: `.info`, `.success`, `.warning`, `.error`

```html
<div class="widget-reminder warning">...</div>
<div class="widget-reminder error">...</div>
```

### Grid Layout Options

Use `.cols-2` or `.cols-3` on `.widget-grid` for column layouts:

```html
<div class="widget-grid cols-2">
    <!-- Widgets will display in 2 columns -->
</div>
```

Full-width widgets (`.widget-full`, `.widget-divider`, `.widget-reminder`) automatically span all columns.

### Widget Section Headers

**DO NOT change** the toggle heading color, padding, or typography unless explicitly requested by the user.
