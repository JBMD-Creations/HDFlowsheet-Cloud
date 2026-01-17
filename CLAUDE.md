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

---

# Supabase Development Guidelines (Experimental)

> These guidelines are adapted from Cursor rules for Supabase development. We're testing whether they help or hurt. Keep this section separate.

## Postgres SQL Style Guide

### General
- Use lowercase for SQL reserved words
- Use snake_case for tables and columns
- Prefer plurals for table names, singular for columns
- Store dates in ISO 8601 format (`yyyy-mm-ddThh:mm:ss.sssss`)
- Include comments for complex logic

### Tables
- Always add an `id` column of type `identity generated always` unless otherwise specified
- Create tables in the `public` schema unless otherwise specified
- Always add the schema prefix to SQL queries for clarity
- Always add a comment describing what the table does

```sql
create table public.books (
  id bigint generated always as identity primary key,
  title text not null,
  author_id bigint references public.authors (id)
);
comment on table public.books is 'A list of all the books in the library.';
```

### Queries
- Use lowercase for SQL keywords
- Add spaces and newlines for readability in larger queries
- Prefer full table names over aliases when referencing tables
- Use CTEs for complex queries with comments for each block

## Database Functions

### Guidelines
1. **Default to `SECURITY INVOKER`** - runs with permissions of the invoking user
2. **Always set `search_path = ''`** - avoid unexpected behavior from untrusted schemas
3. **Use fully qualified names** (e.g., `public.table_name`)
4. **Default to `IMMUTABLE` or `STABLE`** where possible

```sql
create or replace function public.calculate_total(order_id bigint)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  total numeric;
begin
  select sum(price * quantity)
  into total
  from public.order_items
  where order_id = calculate_total.order_id;
  return total;
end;
$$;
```

## RLS Policies

### Rules
- Always use `auth.uid()` instead of `current_user`
- Wrap `auth.uid()` in select for performance: `(select auth.uid())`
- SELECT policies: use `USING`, not `WITH CHECK`
- INSERT policies: use `WITH CHECK`, not `USING`
- UPDATE policies: use both `USING` and `WITH CHECK`
- DELETE policies: use `USING`, not `WITH CHECK`
- Don't use `FOR ALL` - create separate policies for select, insert, update, delete
- Always specify roles with `TO authenticated` or `TO anon`
- Add indexes on columns used in RLS policies

```sql
-- Good: Separate policies with role specified
create policy "Users can view own data"
on public.app_data
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert own data"
on public.app_data
for insert
to authenticated
with check ( (select auth.uid()) = user_id );
```

## Realtime (Broadcast preferred over postgres_changes)

### Do
- Use `broadcast` for all realtime events (more scalable)
- Use `presence` sparingly for user state tracking
- Use topic names like `scope:entity` (e.g., `room:123:messages`)
- Use snake_case for event names: `entity_action` (e.g., `message_created`)
- Include unsubscribe/cleanup logic
- Set `private: true` for channels using RLS

### Don't
- Use `postgres_changes` for new applications (single-threaded, doesn't scale)
- Create multiple subscriptions without cleanup
- Use generic event names like "update" or "change"

### Client Pattern
```javascript
const channelRef = useRef(null)

useEffect(() => {
  if (channelRef.current?.state === 'subscribed') return

  const channel = supabase.channel('room:123:messages', {
    config: { private: true }
  })
  channelRef.current = channel

  channel
    .on('broadcast', { event: 'message_created' }, handleMessage)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('Connected')
    })

  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }
}, [roomId])
```

### Database Trigger for Broadcast
```sql
create or replace function public.notify_changes()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    TG_TABLE_NAME || ':' || coalesce(NEW.id, OLD.id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return coalesce(NEW, OLD);
end;
$$;
```

## Migrations

### File Naming
Files must be named: `YYYYMMDDHHmmss_short_description.sql`
Example: `20240906123045_create_profiles.sql`

### Requirements
- Include header comment with migration purpose
- Write all SQL in lowercase
- Always enable RLS on new tables
- Create separate RLS policies for each operation (select, insert, update, delete)
- Add comments for destructive operations (drop, truncate, alter)

## Edge Functions (Deno)

### Guidelines
- Use Web APIs and Deno core APIs over external dependencies
- Use `npm:` or `jsr:` prefixes for imports (not bare specifiers)
- Always specify versions: `npm:express@4.18.2`
- Use `Deno.serve()` not the deprecated `serve` import
- Pre-populated env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

```typescript
Deno.serve(async (req: Request) => {
  const { name } = await req.json()
  return new Response(JSON.stringify({ message: `Hello ${name}` }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```
