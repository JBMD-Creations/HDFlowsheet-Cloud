# Step 1: Infrastructure Setup

> **Navigation**: [Wiki Home](../WIKI.md) | **Step 1** | [Step 2: Application Development](./STEP_2_APPLICATION.md)

---

## Overview

This guide covers setting up your backend infrastructure: xCloud server, Supabase deployment, nginx reverse proxy, firewalls, and DNS configuration.

**Why do this first?** Your React application needs a backend to connect to. Without the infrastructure in place, you can't test authentication, database queries, or real-time features.

**Estimated time**: 30-60 minutes

---

## Using Claude Code for This Setup

> **Good news!** If you're using Claude Code (the AI assistant), many steps in this guide can be automated. Here's what Claude Code can do vs what requires manual action in web dashboards:

| Task | Claude Code Can Help? | Notes |
|------|----------------------|-------|
| Create xCloud server | No | Requires xCloud dashboard UI |
| Deploy Supabase on xCloud | No | Requires xCloud dashboard UI |
| Configure xCloud firewall | No | Requires xCloud dashboard UI |
| Configure cloud provider firewall | No | Requires Hetzner/Linode dashboard |
| Create Nginx config | **Partial** | Claude can generate the config, you paste it in xCloud |
| Configure Cloudflare DNS | No | Requires Cloudflare dashboard UI |
| Create React project files | **Yes** | Claude can run `npm create vite` and all setup |
| Install npm packages | **Yes** | Claude can run `npm install` commands |
| Create/edit code files | **Yes** | Claude can create all src files directly |
| Set up `.env` files | **Yes** | Claude can create environment files |
| Configure Vercel | No | Requires Vercel dashboard for env vars |

**Pro tip**: For the steps Claude Code can automate, just ask! For example:
- *"Set up a new React project with Vite, Tailwind, and Supabase"*
- *"Create the auth context and Supabase client files"*
- *"Install all the Shadcn UI dependencies"*

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Supabase Server on xCloud](#step-1-create-supabase-server-on-xcloud)
4. [Step 2: Apply Database Schema](#step-2-apply-database-schema)
5. [Step 3: Configure Firewall Rules](#step-3-configure-firewall-rules)
6. [Step 4: Set Up Nginx Reverse Proxy](#step-4-set-up-nginx-reverse-proxy)
7. [Step 5: Configure Cloudflare DNS](#step-5-configure-cloudflare-dns)
8. [Step 6: Set Up React Authentication](#step-6-set-up-react-authentication)
9. [Step 7: Configure Vercel Environment Variables](#step-7-configure-vercel-environment-variables)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Key Learnings & Gotchas](#key-learnings--gotchas)

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Browser  │────▶│     Vercel      │────▶│   Cloudflare    │
│                 │     │  (React App)    │     │   (DNS + SSL)   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Hetzner Server (xCloud)                       │
│  ┌─────────────┐     ┌─────────────────────────────────────┐    │
│  │    Nginx    │────▶│         Docker Containers           │    │
│  │  (Port 443) │     │  ┌─────────┐  ┌─────────┐          │    │
│  │             │     │  │  Kong   │  │ GoTrue  │          │    │
│  │ /rest/v1/   │────▶│  │ :8000   │  │ (Auth)  │          │    │
│  │ /auth/v1/   │     │  └─────────┘  └─────────┘          │    │
│  │ /storage/   │     │  ┌─────────┐  ┌─────────┐          │    │
│  └─────────────┘     │  │Postgres │  │ Studio  │          │    │
│                      │  │ :5432   │  │ :3000   │          │    │
│                      │  └─────────┘  └─────────┘          │    │
│                      └─────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

xCloud deploys Supabase in Docker containers that bind to `127.0.0.1` (localhost only) for security. This means:
- External requests cannot reach Supabase directly on ports 18010-18014
- You MUST use an Nginx reverse proxy to route requests to the internal Docker containers
- Cloudflare provides SSL termination on port 443

---

## Prerequisites

- xCloud account with a server provisioned (Hetzner, Linode, Vultr, etc.)
- Cloudflare account managing your domain's DNS
- Vercel account for deploying the React app
- GitHub repository for your React project

---

## Step 1: Create Supabase Server on xCloud

### 1.1 Create a Docker + Nginx Server

1. Log into xCloud Dashboard
2. Click **"New Server"**
3. Choose your cloud provider (Hetzner, Linode, etc.)
4. Configure:
   - **Server Name**: `app-server` (or your preference)
   - **App Type**: Supabase
   - **Stack**: Docker + NGINX (required for Supabase)
5. Click **Create**
6. Wait for server provisioning (5-10 minutes)

### 1.2 Deploy Supabase Application

1. Go to **Sites** → **Add New Site**
2. Select your Docker + Nginx server
3. Choose **One Click Apps** → **Supabase**
4. Configure:
   - **Site Title**: Your app name
   - **Domain**: `yourdomain.com` (or subdomain)
   - Copy the **Admin Username** and **Admin Password**
5. Click **Next** and complete setup

### 1.3 Note Your Port Assignments

xCloud assigns external ports to Supabase services. Find these in:
**xCloud** → **Sites** → **Your Supabase Site** → **Supabase** → **Environment**

```
# Typical xCloud Supabase Port Mappings
SUPABASE_STUDIO_PORT=18010      # Dashboard UI
SUPABASE_KONG_HTTP_PORT=18011   # API Gateway (Main API)
SUPABASE_KONG_HTTPS_PORT=18012  # API Gateway (HTTPS)
SUPABASE_POSTGRES_PORT=18013    # PostgreSQL
SUPABASE_ANALYTICS_PORT=18014   # Analytics
```

### 1.4 Get Your API Keys

In the Supabase Environment section, find:
```
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Save the `ANON_KEY` - you'll need it for your React app.

---

## Step 2: Apply Database Schema

### 2.1 Access Supabase Dashboard

The Supabase Studio dashboard is accessible at:
```
https://yourdomain.com:18010
```

**Note**: This may not work initially due to firewall restrictions. Complete Step 3 first if needed.

### 2.2 Create Your Schema

1. Open Supabase Dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste your database schema SQL
5. Click **Run**

Example schema for authentication with user data:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Example: Users table with RLS
CREATE TABLE IF NOT EXISTS user_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view their own data"
  ON user_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data"
  ON user_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
  ON user_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data"
  ON user_data FOR DELETE
  USING (auth.uid() = user_id);
```

### 2.3 Verify Schema

After running, you should see:
```
Success. No rows returned
```

This is expected - DDL statements don't return rows.

---

## Step 3: Configure Firewall Rules

**CRITICAL**: xCloud Supabase containers bind to `127.0.0.1` (localhost), so opening firewall ports alone won't make them accessible. However, you still need to open ports for the Nginx reverse proxy to work.

### 3.1 xCloud Server Firewall

1. Go to **xCloud** → **Servers** → **Your Server** → **Security** → **Firewall Management**
2. Click **Add New Rule**
3. Add rule:
   - **Name**: `Supabase API`
   - **Port**: `18010:18014` (use colon for range)
   - **Protocol**: TCP
   - **IP Address**: Leave empty (allow all)
   - **Traffic**: Allow
4. Click **Add Rule**

### 3.2 Cloud Provider Firewall (Hetzner/Linode/etc.)

This is separate from xCloud's firewall!

#### For Hetzner:

1. Log into **Hetzner Console** (console.hetzner.cloud)
2. Go to **Servers** → Select your server → **Firewalls**
3. Either create a new firewall or edit existing
4. Add **Inbound Rule**:
   - **Sources**: Any IPv4
   - **Protocol**: TCP
   - **Port**: `18010-18014` (use dash for range in Hetzner)
5. Apply firewall to your server

#### For Linode:

1. Log into **Linode Dashboard** (cloud.linode.com)
2. Go to **Firewalls** → Select or create firewall
3. Add **Inbound Rule** for ports 18010-18014 TCP
4. Apply to your Linode server

### 3.3 Verify Firewall Configuration

After configuring, test by accessing:
```
https://yourdomain.com:18011/rest/v1/
```

**Expected result**: "Connection timed out" - this is expected because Docker containers bind to localhost! Continue to Step 4.

---

## Step 4: Set Up Nginx Reverse Proxy

**THIS IS THE KEY STEP** that makes Supabase accessible externally.

### 4.1 Why Nginx Reverse Proxy?

When you run `docker ps` on your xCloud server, you'll see:
```
127.0.0.1:18011->8000/tcp   supabase-kong
127.0.0.1:18010->3000/tcp   supabase-studio
```

The `127.0.0.1` binding means these containers only accept connections from localhost. Nginx on the same server can reach them and proxy external requests.

### 4.2 Create Nginx Configuration

1. Go to **xCloud** → **Sites** → **Your Supabase Site** → **Tools** → **Nginx Customization**
2. Click **Create Custom Nginx Configuration**
3. Configure:
   - **Select Template**: Use My Own Config
   - **Select Config Type**: Inside Server Block
   - **Config File Name**: `supabase-proxy`
4. Paste this configuration:

```nginx
# Supabase API proxy - Routes external requests to internal Docker containers

# REST API (PostgREST)
location /rest/v1/ {
    proxy_pass http://127.0.0.1:18011/rest/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
    proxy_pass_header Authorization;
}

# Auth API (GoTrue)
location /auth/v1/ {
    proxy_pass http://127.0.0.1:18011/auth/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
    proxy_pass_header Authorization;
}

# Storage API
location /storage/v1/ {
    proxy_pass http://127.0.0.1:18011/storage/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
    proxy_pass_header Authorization;
}

# Realtime API (WebSockets)
location /realtime/v1/ {
    proxy_pass http://127.0.0.1:18011/realtime/v1/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

5. Click **Run & Debug** to test the configuration
6. If no errors, click **Save Config**

### 4.3 Verify Nginx Proxy

Test by visiting:
```
https://yourdomain.com/rest/v1/
```

**Expected result**:
```
Kong Error
No API key found in request.
```

This error means SUCCESS! Kong is responding, which means:
- Nginx is proxying requests correctly
- Kong (Supabase API Gateway) is receiving them
- You just need to provide the API key in your app

---

## Step 5: Configure Cloudflare DNS

### 5.1 DNS Settings

1. Log into Cloudflare Dashboard
2. Select your domain
3. Go to **DNS** → **Records**

### 5.2 Configure A Record

Your domain should have an A record pointing to your server:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | yourdomain.com | YOUR_SERVER_IP | Proxied (orange cloud) |

### 5.3 Proxy Status Explained

**Proxied (Orange Cloud)**:
- Cloudflare provides SSL automatically
- Works with standard ports (80, 443)
- Recommended for the nginx reverse proxy setup

**DNS Only (Grey Cloud)**:
- Direct connection to your server
- Required if accessing non-standard ports directly (18010-18014)
- You need your own SSL certificate

**For this setup**: Use **Proxied** because we're using Nginx on port 443.

### 5.4 SSL/TLS Settings

1. Go to **SSL/TLS** in Cloudflare
2. Set mode to **Full** or **Full (strict)**
3. This ensures end-to-end encryption

---

## Step 6: Set Up React Authentication

### 6.1 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 6.2 Create Supabase Client

Create `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 6.3 Create Auth Context

Create `src/contexts/AuthContext.jsx`:

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email/password
  const signUp = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in with email/password
  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 6.4 Create Environment File

Create `.env` in your project root:

```env
VITE_SUPABASE_URL=https://yourdomain.com
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**IMPORTANT**: The URL should NOT include a port number when using the nginx reverse proxy!

### 6.5 Add to .gitignore

Ensure `.env` is in your `.gitignore`:

```
.env
.env.local
.env.production
```

### 6.6 Create .env.example for Reference

```env
VITE_SUPABASE_URL=https://yourdomain.com
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Step 7: Configure Vercel Environment Variables

### 7.1 Add Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://yourdomain.com` (NO port number!)
   - **Environments**: Production, Preview, Development

5. Add:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Your anon key from Supabase
   - **Environments**: Production, Preview, Development

### 7.2 Redeploy

After adding environment variables:
1. Go to **Deployments**
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**

Or push a new commit to trigger automatic redeployment.

---

## Troubleshooting Guide

### Problem: "Failed to fetch" Error

**Symptoms**: Login/signup shows "Failed to fetch" in the browser

**Causes & Solutions**:

1. **Wrong Supabase URL**
   - Check if URL has the wrong port
   - With nginx proxy: Use `https://yourdomain.com` (no port)
   - Without nginx: Use `https://yourdomain.com:18011`

2. **Firewall blocking**
   - Check both xCloud AND cloud provider firewalls
   - Ports 18010-18014 must be open in BOTH

3. **Cloudflare proxy issues**
   - Cloudflare proxy doesn't support non-standard ports
   - Either disable proxy (DNS only) OR use nginx reverse proxy

4. **Docker containers not running**
   - SSH into server or use xCloud Commands
   - Run `docker ps` to verify containers are running

### Problem: "Connection Timed Out"

**Symptoms**: Browser shows connection timeout when accessing Supabase URLs

**Causes & Solutions**:

1. **Firewall not configured**
   - Check both xCloud and cloud provider firewalls
   - Verify ports 18010-18014 are open

2. **Docker binding to localhost**
   - Run `docker ps` and check port bindings
   - If you see `127.0.0.1:18011->8000/tcp`, you MUST use nginx reverse proxy

### Problem: "Kong Error - No API key found"

**This is actually SUCCESS!**

This error means Kong (Supabase API Gateway) is responding. Your app just needs to include the API key in requests, which the Supabase client library does automatically.

### Problem: SSL Certificate Error

**Symptoms**: Browser shows "Your connection is not private"

**Solutions**:

1. **Enable Cloudflare Proxy**
   - Go to Cloudflare DNS
   - Change A record from "DNS only" to "Proxied"
   - Cloudflare provides automatic SSL

2. **Or install SSL certificate**
   - Use xCloud's SSL feature
   - Or configure Let's Encrypt manually

### Problem: "Syncing..." Indefinitely

**Symptoms**: App shows sync status stuck on "Syncing..."

**Solutions**:

1. **Check browser console**
   - Press F12 → Console tab
   - Look for red error messages

2. **Database permissions**
   - Verify RLS policies are correct
   - Check if user has permissions for the tables

3. **Missing useEffect dependency**
   - Ensure sync function is in useEffect dependency array

### Problem: Email Not Sending

**Symptoms**: Users sign up but don't receive verification emails

**Solutions**:

1. **Enable auto-confirm** (quickest fix):
   - In xCloud → Supabase → Environment
   - Add: `ENABLE_EMAIL_AUTOCONFIRM=true`
   - Restart Docker

2. **Configure SMTP**:
   - Add SMTP settings to Supabase Environment:
   ```
   GOTRUE_SMTP_HOST=smtp.provider.com
   GOTRUE_SMTP_PORT=587
   GOTRUE_SMTP_USER=your_user
   GOTRUE_SMTP_PASS=your_password
   GOTRUE_SMTP_ADMIN_EMAIL=admin@yourdomain.com
   ```
   - Restart Docker

---

## Key Learnings & Gotchas

### 1. Docker Containers Bind to Localhost

The most important discovery: xCloud Supabase containers bind to `127.0.0.1`, not `0.0.0.0`. This means:
- Opening firewall ports alone won't work
- You MUST use nginx reverse proxy
- Or modify Docker compose to bind to `0.0.0.0` (less secure)

**How to check**:
```bash
docker ps
# Look for: 127.0.0.1:18011->8000/tcp (localhost only)
# vs: 0.0.0.0:18011->8000/tcp (all interfaces)
```

### 2. Two Firewalls to Configure

xCloud has its own firewall AND your cloud provider has a firewall. You must configure BOTH:
- xCloud: Server → Security → Firewall Management
- Hetzner/Linode/etc.: Their own dashboard

### 3. Cloudflare Proxy and Non-Standard Ports

Cloudflare's proxy only supports standard ports (80, 443, and a few others). For non-standard ports like 18011:
- Either disable Cloudflare proxy (DNS only) and lose automatic SSL
- Or use nginx reverse proxy on port 443 (recommended)

### 4. Environment Variables in Vite

For Vite projects, environment variables must:
- Start with `VITE_` prefix
- Be in `.env` file in project root
- Be added to Vercel dashboard for production

### 5. Supabase URL Format

When using nginx reverse proxy:
```
VITE_SUPABASE_URL=https://yourdomain.com  # Correct
VITE_SUPABASE_URL=https://yourdomain.com:18011  # Wrong
```

The Supabase client library automatically appends `/rest/v1/`, `/auth/v1/`, etc.

### 6. Row Level Security (RLS)

Always enable RLS on tables containing user data:
```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

Without RLS policies, authenticated users can't access any data!

---

## Quick Reference

### URLs

| Service | URL |
|---------|-----|
| React App | https://hdv.jbcloud.app |
| Supabase API | https://jbcloud.app (via nginx proxy) |
| Supabase Studio | https://jbcloud.app:18010 |

### Port Mappings

| Port | Service |
|------|---------|
| 18010 | Supabase Studio (Dashboard) |
| 18011 | Kong HTTP (API Gateway) |
| 18012 | Kong HTTPS |
| 18013 | PostgreSQL |
| 18014 | Analytics |

### Environment Variables

```env
VITE_SUPABASE_URL=https://jbcloud.app
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

### Nginx Proxy Paths

| Path | Proxies To |
|------|------------|
| /rest/v1/ | PostgREST API |
| /auth/v1/ | GoTrue Auth |
| /storage/v1/ | Storage API |
| /realtime/v1/ | Realtime WebSockets |

---

## Files Created/Modified

1. `src/lib/supabase.js` - Supabase client initialization
2. `src/contexts/AuthContext.jsx` - Authentication state management
3. `src/contexts/SupabaseDataContext.jsx` - Data sync with Supabase
4. `src/components/auth/AuthModal.jsx` - Login/signup modal
5. `src/components/auth/AuthModal.css` - Modal styling
6. `src/components/auth/UserMenu.jsx` - User menu dropdown
7. `.env` - Environment variables (gitignored)
8. `.env.example` - Environment variable template
9. `supabase_schema.sql` - Database schema

---

## Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify Docker containers are running (`docker ps`)
3. Test API endpoint: `https://yourdomain.com/rest/v1/`
4. Check xCloud and cloud provider firewalls
5. Contact xCloud support for Supabase-specific issues

---

## Next Steps

Once your infrastructure is running and you can access the API, proceed to:

**[Step 2: Application Development](./STEP_2_APPLICATION.md)** - Build your React frontend with Tailwind CSS, Shadcn UI, and real-time features.

---

> **Navigation**: [Wiki Home](../WIKI.md) | **Step 1** | [Step 2: Application Development](./STEP_2_APPLICATION.md)

---

*Last updated: January 15, 2026*
*Created with Claude Code assistance*
