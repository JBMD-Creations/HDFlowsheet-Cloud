# Supabase Development Guidelines

This project uses Supabase. Follow these guidelines when writing code.

## SQL Style

- Use **lowercase** for all SQL keywords (`select`, `from`, `where`)
- Use **snake_case** for tables, columns, and functions
- Use **plural** names for tables (`users`, `orders`)
- Use **singular** names for columns (`user_id`, `created_at`)
- Foreign keys: `{singular_table}_id` (e.g., `user_id` references `users`)
- Always add table comments: `comment on table x is 'description';`

## Schema Design

- Every table must have: `id bigint generated always as identity primary key`
- Always index foreign key columns (PostgreSQL doesn't auto-index them)
- Create tables in `public` schema unless specified otherwise

```sql
create table public.orders (
  id bigint generated always as identity primary key,
  user_id bigint references public.users (id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index on public.orders (user_id);
comment on table public.orders is 'Customer orders';

-- Auto-update updated_at timestamp (moddatetime extension already enabled)
create trigger handle_updated_at before update
  on public.orders
  for each row execute procedure moddatetime(updated_at);
```

## Auto-Update Timestamps

- Tables with `updated_at` columns MUST have the moddatetime trigger
- The `moddatetime` extension is already enabled in this project
- Always add this trigger when creating tables with `updated_at`:

```sql
create trigger handle_updated_at before update
  on public.your_table
  for each row execute procedure moddatetime(updated_at);
```

## Row-Level Security (RLS)

- Enable RLS on **every** table exposed via API
- Create separate policies for each operation (`select`, `insert`, `update`, `delete`)
- Use `(select auth.uid())` instead of `auth.uid()` for better performance
- Always specify the role with `to authenticated` or `to anon`

```sql
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

## Database Functions

- Default to `security invoker`
- Always set `search_path = ''` and use fully-qualified names
- Prefer `language sql` over `plpgsql` when possible (allows inlining)
- Use `immutable` or `stable` when function doesn't modify data

```sql
create or replace function public.get_user_orders(user_uuid uuid)
returns setof public.orders
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  select * from public.orders where user_id = user_uuid;
end;
$$;
```

## Migrations

- Location: `supabase/migrations/`
- Naming: `YYYYMMDDHHmmss_short_description.sql` (UTC time)
- Include header comments describing the migration
- Enable RLS on all new tables
- Add indexes for foreign keys and RLS policy columns

## Edge Functions

- Use `Deno.serve()` (not the deprecated `serve` import)
- Use `npm:` or `jsr:` prefixes for dependencies with versions: `npm:express@4.18.2`
- Shared utilities go in `supabase/functions/_shared/`
- Pre-populated env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

```typescript
Deno.serve(async (req: Request) => {
  const { name } = await req.json();
  return new Response(JSON.stringify({ message: `Hello ${name}` }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Realtime

- Use `broadcast` for all realtime events (not `postgres_changes`)
- Use topic pattern: `scope:entity:id` (e.g., `room:123:messages`)
- Use event pattern: `entity_action` (e.g., `message_created`)
- Set `private: true` for channels with RLS
- Always include cleanup/unsubscribe logic

```javascript
const channel = supabase.channel('room:123:messages', {
  config: { private: true }
})
.on('broadcast', { event: 'message_created' }, handleMessage)

await supabase.realtime.setAuth()
await channel.subscribe()

// Cleanup
supabase.removeChannel(channel)
```

## Client-Side

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Always handle errors
const { data, error } = await supabase.from('users').select('*')
if (error) {
  console.error('Error:', error.message)
  return
}
```
