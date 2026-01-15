# Claude Context - Read Before Each Response

## User Environment

- **Supabase**: Hosted on **xCloud.host** (Hetzner server) as a web app (NOT self-hosted CLI)
- **Development**: Uses xCloud.host web interface, NOT local terminal/CLI/Bash
- **Database Management**: Done through Supabase web dashboard SQL Editor
- **Deployment**: Via Vercel

## Important Notes

1. **No CLI/Terminal Access**: User does not use Supabase CLI, psql, or terminal commands for database operations
2. **All Supabase setup was done by Claude** through the xCloud.host web interface
3. **SQL execution**: Copy SQL from `supabase_schema.sql` and paste into Supabase Dashboard > SQL Editor > New Query > Run
4. **Nginx Reverse Proxy**: API requests go through nginx on port 443, NOT directly to Docker ports

## xCloud Supabase Port Configuration

| Service | External Port | Internal Port | Docker Binding |
|---------|---------------|---------------|----------------|
| Studio (Dashboard) | 18010 | 3000 | 127.0.0.1 (localhost) |
| Kong API | 18011 | 8000 | 127.0.0.1 (localhost) |
| Kong HTTPS | 18012 | 8443 | 127.0.0.1 (localhost) |
| PostgreSQL | 18013 | 5432 | 127.0.0.1 (localhost) |
| Analytics | 18014 | 4000 | 127.0.0.1 (localhost) |

**CRITICAL**: Docker containers bind to `127.0.0.1` (localhost only), so direct port access doesn't work from external sources. Must use nginx reverse proxy.

## Nginx Reverse Proxy Configuration

Configured in xCloud → Sites → jbcloud.app → Tools → Nginx Customization

Routes:
- `/rest/v1/` → `http://127.0.0.1:18011/rest/v1/`
- `/auth/v1/` → `http://127.0.0.1:18011/auth/v1/`
- `/storage/v1/` → `http://127.0.0.1:18011/storage/v1/`

## How to Run Database Schema

1. Open your Supabase project dashboard (web browser)
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `supabase_schema.sql` file from this project
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** button

## Project Files Reference

- `supabase_schema.sql` - Database schema (12 tables, RLS policies, indexes, triggers)
- `.env.example` - Environment variable template
- `.env` - Local environment variables (gitignored)
- `src/lib/supabase.js` - Supabase client initialization
- `XCLOUD_SUPABASE_SETUP_GUIDE.md` - Comprehensive setup documentation

## Supabase URLs

- **Dashboard/Studio**: `https://jbcloud.app:18010` (direct port access, may need firewall open)
- **API (for app)**: `https://jbcloud.app` (via nginx reverse proxy - NO PORT!)

## App Deployment

- **Frontend App URL**: `https://hdv.jbcloud.app` (hosted on Vercel)
- **Vercel Env Vars Required**:
  - `VITE_SUPABASE_URL` = `https://jbcloud.app` (NO PORT - uses nginx proxy)
  - `VITE_SUPABASE_ANON_KEY` = (the JWT token)

## Cloudflare Configuration

- DNS A record for `jbcloud.app` → Server IP
- Proxy Status: **Proxied** (orange cloud) for SSL
- Cloudflare provides automatic SSL on port 443

## Firewall Configuration

Two firewalls must be configured:
1. **xCloud Firewall**: Server → Security → Firewall Management
2. **Hetzner Firewall**: Hetzner Console → Firewalls

Ports 18010-18014 TCP must be open in BOTH firewalls.
