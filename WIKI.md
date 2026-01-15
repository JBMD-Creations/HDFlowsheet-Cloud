# Project Wiki: Building Modern Web Apps with xCloud + Supabase + React

Welcome to the complete documentation for building production-ready web applications using xCloud, Supabase, Shadcn UI, and React. This wiki guides you through the entire process from zero to deployed application.

---

## Who Is This For?

This wiki is designed for developers who want to:
- Self-host their backend using **xCloud** (instead of paying for managed Supabase)
- Build modern React applications with **real-time features**
- Use beautiful, accessible UI components with **Shadcn UI**
- Deploy and share their applications with the world

**No prior experience required** - each guide explains concepts from the ground up.

---

## The Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Hosting** | xCloud.host | Server provisioning and management |
| **Backend** | Supabase | Database, authentication, storage, real-time |
| **Proxy** | Nginx | Routes external requests to Docker containers |
| **DNS/SSL** | Cloudflare | Domain management and free SSL certificates |
| **Frontend** | React + Vite | Fast, modern web application framework |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Components** | Shadcn UI | Beautiful, accessible UI components |
| **Deployment** | Vercel/Netlify | Frontend hosting with auto-deploy |
| **AI Assistant** | Claude Code | Development assistance |
| **Version Control** | GitHub | Code storage and collaboration |

---

## Setup Process Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STEP 1: INFRASTRUCTURE                        │
│   Set up xCloud server, deploy Supabase, configure networking       │
│                                                                      │
│   xCloud Server  →  Supabase Docker  →  Nginx Proxy  →  Cloudflare  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      STEP 2: APPLICATION SETUP                       │
│   Create React project, install UI libraries, connect to backend    │
│                                                                      │
│   Vite + React  →  Tailwind CSS  →  Shadcn UI  →  Supabase Client   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        STEP 3: DEPLOYMENT                            │
│   Push to GitHub, deploy frontend, configure environment vars       │
│                                                                      │
│   GitHub Repo  →  Vercel/Netlify  →  Environment Variables  →  Live │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Documentation Index

### Step 1: Infrastructure Setup
**[STEP_1_INFRASTRUCTURE.md](./docs/STEP_1_INFRASTRUCTURE.md)**

*Estimated time: 30-60 minutes*

This guide covers setting up your backend infrastructure:

| Topic | What You'll Learn |
|-------|-------------------|
| xCloud Server | Creating and configuring a cloud server |
| Supabase Deployment | Installing Supabase via One-Click App |
| Docker Containers | Understanding how Supabase runs in Docker |
| Nginx Reverse Proxy | Why you need it and how to configure it |
| Firewalls | Configuring xCloud AND cloud provider firewalls |
| Cloudflare DNS | Setting up your domain with SSL |
| Testing | Verifying everything works |

**Why do this first?** Your React application needs a backend to connect to. Without the infrastructure in place, you can't test authentication, database queries, or real-time features.

---

### Step 2: Application Development
**[STEP_2_APPLICATION.md](./docs/STEP_2_APPLICATION.md)**

*Estimated time: 45-90 minutes*

This guide covers building your frontend application:

| Topic | What You'll Learn |
|-------|-------------------|
| React + Vite | Creating a modern React project |
| Tailwind CSS | Installing and configuring CSS framework |
| Shadcn UI | Adding beautiful, accessible components |
| Supabase Client | Connecting your app to the backend |
| Authentication | User login, signup, and session management |
| Real-Time Features | Chat, presence, and cursor tracking |
| Deployment | Getting your app live on the web |

**Why do this second?** Once your backend is ready, you can build and test your application against real infrastructure.

---

## Quick Links

### Guides
- [Step 1: Infrastructure Setup](./docs/STEP_1_INFRASTRUCTURE.md)
- [Step 2: Application Development](./docs/STEP_2_APPLICATION.md)

### Reference Files
- [Database Schema](./supabase_schema.sql) - SQL for creating tables
- [Environment Template](./.env.example) - Required environment variables
- [Supabase Development Guidelines](./CLAUDE.md) - SQL style and best practices

### External Resources
- [xCloud Documentation](https://xcloud.host/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
│                        (React App from Vercel)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS (port 443)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUDFLARE                                      │
│                    (DNS, SSL termination, DDoS protection)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         XCLOUD SERVER (Hetzner)                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          NGINX (Port 443)                              │  │
│  │   /rest/v1/  ───────────────────────────────────┐                      │  │
│  │   /auth/v1/  ────────────────────────────────┐  │                      │  │
│  │   /storage/v1/ ───────────────────────────┐  │  │                      │  │
│  │   /realtime/v1/ ───────────────────────┐  │  │  │                      │  │
│  └────────────────────────────────────────│──│──│──│──────────────────────┘  │
│                                           │  │  │  │                          │
│  ┌────────────────────────────────────────│──│──│──│──────────────────────┐  │
│  │              DOCKER CONTAINERS         ▼  ▼  ▼  ▼                      │  │
│  │   ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │   │                    KONG API GATEWAY                              │ │  │
│  │   │                    (127.0.0.1:18011)                             │ │  │
│  │   └─────────────────────────────────────────────────────────────────┘ │  │
│  │              │              │              │              │            │  │
│  │              ▼              ▼              ▼              ▼            │  │
│  │   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │   │  PostgREST   │ │   GoTrue     │ │   Storage    │ │  Realtime    │ │  │
│  │   │ (REST API)   │ │   (Auth)     │ │   (Files)    │ │ (WebSocket)  │ │  │
│  │   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │  │
│  │              │                                                         │  │
│  │              ▼                                                         │  │
│  │   ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │   │                     POSTGRESQL DATABASE                          │ │  │
│  │   │                     (127.0.0.1:18013)                            │ │  │
│  │   └─────────────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts Explained

### Why Self-Host with xCloud?

**Cost Savings**: Supabase's managed service starts free but can get expensive as you scale. Self-hosting on xCloud gives you:
- Full control over your data
- Predictable monthly costs
- No usage-based billing surprises

**Trade-off**: You're responsible for server maintenance and updates.

### Why Nginx Reverse Proxy?

When xCloud deploys Supabase, the Docker containers bind to `127.0.0.1` (localhost) for security. This means:
- External requests **cannot** reach them directly
- You need Nginx to forward requests from port 443 to the internal Docker ports

```
External Request → Nginx (443) → Docker Container (127.0.0.1:18011)
```

### Why Cloudflare?

Cloudflare provides:
- **Free SSL certificates** (HTTPS)
- **DDoS protection**
- **CDN caching** for faster load times
- **DNS management**

When Cloudflare is set to "Proxied" mode, all traffic goes through their network, automatically encrypting with SSL.

### Why Shadcn UI Instead of a Component Library?

Traditional component libraries (Material UI, Ant Design) give you pre-built components, but:
- Hard to customize deeply
- Large bundle sizes
- Dependency on library updates

Shadcn UI is different:
- **Copy components into your project** - you own the code
- **Full customization** - modify anything you want
- **No runtime dependency** - just your code
- **Accessible by default** - built on Radix UI primitives

---

## Troubleshooting Quick Reference

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "Failed to fetch" | Wrong Supabase URL | Remove port from URL (use nginx) |
| "Connection timed out" | Firewall blocking | Check BOTH xCloud and provider firewalls |
| "Kong Error - No API key" | API working! | This is success - client adds key automatically |
| Styles not working | Tailwind not loaded | Check CSS import in main.jsx |
| Auth not persisting | Session storage issue | Check localStorage key in supabase.js |

See individual step guides for detailed troubleshooting.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-14 | Added Step 2: Application Development guide |
| 2026-01-14 | Created Wiki structure |
| 2026-01-13 | Added Step 1: Infrastructure Setup guide |
| 2026-01-13 | Initial project setup |

---

## Contributing

To add new documentation:
1. Create a new `.md` file in the `docs/` folder
2. Add a link to this wiki index
3. Follow the existing format for consistency

---

*This wiki is maintained with Claude Code assistance.*
