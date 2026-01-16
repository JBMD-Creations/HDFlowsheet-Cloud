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
