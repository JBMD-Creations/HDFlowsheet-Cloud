# Step 2: Application Development

> **Navigation**: [Wiki Home](../WIKI.md) | [Step 1: Infrastructure Setup](./STEP_1_INFRASTRUCTURE.md) | **Step 2**

---

## Overview

This guide covers building your frontend application: React project setup, Tailwind CSS, Shadcn UI components, Supabase client connection, authentication, and real-time features.

**Prerequisites**: Complete [Step 1: Infrastructure Setup](./STEP_1_INFRASTRUCTURE.md) first. You need a running Supabase instance to connect to.

**Estimated time**: 45-90 minutes (or 10-15 minutes with Claude Code!)

---

## Using Claude Code for This Setup

> **Claude Code can automate nearly ALL of the application setup!** Instead of manually running terminal commands and copy-pasting code, you can ask Claude Code to do it for you.

### What Claude Code Can Do

| Task | Manual Time | With Claude Code |
|------|-------------|------------------|
| Create React project | 5 min | Instant |
| Install all dependencies | 10 min | Instant |
| Configure Tailwind CSS | 10 min | Instant |
| Create all component files | 30+ min | Instant |
| Set up Supabase client | 5 min | Instant |
| Create auth context | 10 min | Instant |
| Set up environment files | 5 min | Instant |

### How to Use Claude Code

Simply ask Claude Code to set things up. Example prompts:

1. **Full project setup**: *"Create a new React project with Vite, Tailwind CSS v4, and Supabase. Include the auth context and basic UI components."*

2. **Add specific features**: *"Add the Shadcn UI button, input, and card components to my project"*

3. **Connect to Supabase**: *"Create the Supabase client file and .env with my URL: https://mydomain.com and anon key: eyJ..."*

4. **Add real-time features**: *"Add the real-time chat hook from the guide"*

### What You Still Need to Do Manually

- **Get your Supabase credentials** from xCloud dashboard (ANON_KEY, URL)
- **Configure Vercel environment variables** in Vercel dashboard
- **Deploy to Vercel/Netlify** (though Claude can help with build commands)

---

> **Note**: The detailed instructions below are provided as reference. If you're using Claude Code, you can skip the manual steps and just ask Claude to set things up!

---

## What Are These Tools?

Before we start, let's understand what each tool does:

| Tool | What It Does |
|------|--------------|
| **xCloud** | A web hosting platform that lets you deploy servers and applications without managing infrastructure yourself |
| **Supabase** | An open-source alternative to Firebase. Provides a database, authentication, file storage, and real-time features |
| **Shadcn UI** | A collection of beautiful, accessible UI components you can copy into your project |
| **Tailwind CSS** | A CSS framework that lets you style elements using pre-built classes like `bg-blue-500` |
| **Claude Code** | An AI assistant (that's me!) that helps you write code |
| **GitHub** | A platform for storing and sharing your code with version control |
| **Vite** | A fast build tool for modern web projects |

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting Up Your React Project](#part-2-setting-up-your-react-project)
3. [Installing Tailwind CSS](#part-3-installing-tailwind-css)
4. [Installing Shadcn UI Components](#part-4-installing-shadcn-ui-components)
5. [Connecting to Supabase](#part-5-connecting-to-supabase)
6. [Setting Up Authentication](#part-6-setting-up-authentication)
7. [Adding Shadcn UI Components](#part-7-adding-shadcn-ui-components)
8. [Real-Time Features](#part-8-real-time-features)
9. [Deployment](#part-9-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, you need:

1. **An xCloud account** - Sign up at [xCloud.host](https://xcloud.host)
2. **A Cloudflare account** - Sign up at [cloudflare.com](https://cloudflare.com) (free tier works)
3. **A domain name** - You can buy one from Cloudflare, Namecheap, GoDaddy, etc.
4. **A GitHub account** - Sign up at [github.com](https://github.com)
5. **A Vercel account** (optional) - Sign up at [vercel.com](https://vercel.com) for deployment
6. **Node.js installed** - Download from [nodejs.org](https://nodejs.org) (LTS version recommended)

---

## Before You Begin: Infrastructure Setup

> **Important**: Before building your application, you need a running Supabase backend.
>
> Complete **[Step 1: Infrastructure Setup](./STEP_1_INFRASTRUCTURE.md)** first to set up:
> - xCloud server with Supabase
> - Nginx reverse proxy configuration
> - Firewall rules
> - Cloudflare DNS and SSL
>
> Once your backend is running and you can access `https://yourdomain.com/rest/v1/` (showing a "Kong Error - No API key found" message), you're ready to continue.

---

## Part 1: Setting Up Your React Project

> **Claude Code Tip**: Ask *"Create a new Vite React project with TypeScript support and set up the directory structure"* and Claude will run all the commands below for you.

### Step 2.1: Create a New Project

Open your terminal and run (or ask Claude Code to do this):

```bash
# Create a new Vite project with React
npm create vite@latest my-app -- --template react

# Navigate into the project
cd my-app

# Install dependencies
npm install
```

### Step 2.2: Configure Path Aliases

Create or edit `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `jsconfig.json` in the project root:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Step 2.3: Project Structure

Organize your project like this:

```
my-app/
├── src/
│   ├── components/
│   │   └── ui/          # Shadcn UI components go here
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/
│   │   ├── supabase.js  # Supabase client
│   │   └── utils.ts     # Utility functions
│   ├── styles/          # CSS files
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── .env                 # Environment variables (gitignored)
├── .env.example         # Template for env variables
├── package.json
└── vite.config.js
```

Create these directories:

```bash
mkdir -p src/components/ui src/contexts src/hooks src/lib src/styles
```

---

## Part 3: Installing Tailwind CSS

> **Claude Code Tip**: Ask *"Install and configure Tailwind CSS v4 for my Vite project"* and Claude will handle all the steps below.

### Step 3.1: Install Tailwind CSS v4

```bash
npm install tailwindcss @tailwindcss/vite
```

### Step 3.2: Configure Vite for Tailwind

Update `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Step 3.3: Add Tailwind to Your CSS

Edit `src/index.css`:

```css
@import "tailwindcss";

/* Your custom styles below */
```

### Step 3.4: Import CSS in main.jsx

Make sure your `src/main.jsx` imports the CSS:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## Part 4: Installing Shadcn UI Components

> **Claude Code Tip**: Ask *"Install all Shadcn UI dependencies and create the button, input, and card components"* and Claude will install packages and create all the component files for you.

### What is Shadcn UI?

Shadcn UI is NOT a component library you install. Instead, you copy individual components into your project. This gives you full control over the code.

### Step 4.1: Install Required Dependencies

```bash
# Core dependencies for Shadcn UI
npm install class-variance-authority clsx tailwind-merge

# Radix UI primitives (accessible component foundations)
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-checkbox @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-avatar

# Icons
npm install lucide-react

# For toast notifications
npm install sonner

# For date picker (optional)
npm install date-fns react-day-picker
```

### Step 4.2: Create the Utils File

Create `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This `cn` function combines Tailwind classes intelligently, handling conflicts.

### Step 4.3: Add Your First Component - Button

Create `src/components/ui/button.tsx`:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

### Step 4.4: Add Input Component

Create `src/components/ui/input.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

### Step 4.5: Add Card Component

Create `src/components/ui/card.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### Step 4.6: Other Commonly Used Components

You can find more components at [ui.shadcn.com](https://ui.shadcn.com). Popular ones include:

- **Dialog** - Modal windows
- **Dropdown Menu** - Menus that appear on click
- **Avatar** - User profile pictures
- **Badge** - Small status indicators
- **Skeleton** - Loading placeholders
- **Table** - Data tables
- **Tabs** - Tab navigation
- **Tooltip** - Hover hints

---

## Part 5: Connecting to Supabase

> **Claude Code Tip**: Tell Claude *"Set up Supabase with URL https://mydomain.com and anon key eyJ..."* and Claude will install the package, create the client file, and set up your .env files.

### Step 5.1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 5.2: Create Environment Variables

Create `.env` in your project root:

```env
VITE_SUPABASE_URL=https://yourdomain.com
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**IMPORTANT**:
- The URL should NOT have a port number (nginx proxies to the correct ports)
- Get your ANON_KEY from xCloud → Sites → Your Site → Supabase → Environment

Create `.env.example` (this gets committed to git):

```env
VITE_SUPABASE_URL=https://yourdomain.com
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Add `.env` to `.gitignore`:

```
.env
.env.local
.env.production
```

### Step 5.3: Create Supabase Client

Create `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'my-app-auth'
    }
  }
)
```

---

## Part 6: Setting Up Authentication

> **Claude Code Tip**: Ask *"Create the auth context with sign up, sign in, and sign out functions"* and Claude will create the AuthContext file and LoginForm component.

### Step 6.1: Create Auth Context

Create `src/contexts/AuthContext.jsx`:

```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign up with email/password
  const signUp = async (email, password) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Sign in with email/password
  const signIn = async (email, password) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Step 6.2: Wrap Your App with AuthProvider

Update `src/App.jsx`:

```jsx
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
      <div className="min-h-screen bg-background">
        <h1>My App</h1>
      </div>
    </AuthProvider>
  )
}

export default App
```

### Step 6.3: Create a Simple Login Form

Create `src/components/auth/LoginForm.jsx`:

```jsx
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card'

export function LoginForm() {
  const { signIn, signUp, error, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isSignUp) {
        await signUp(email, password)
        alert('Check your email to confirm your account!')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
```

---

## Part 7: Adding Shadcn UI Components

Here's a reference for commonly used Shadcn components in this project:

### Available Components

| Component | File | Purpose |
|-----------|------|---------|
| Avatar | `avatar.tsx` | User profile pictures |
| Badge | `badge.tsx` | Status indicators |
| Button | `button.tsx` | Clickable actions |
| Calendar | `calendar.tsx` | Date picker |
| Card | `card.tsx` | Content containers |
| Checkbox | `checkbox.tsx` | Toggle options |
| Dialog | `dialog.tsx` | Modal windows |
| Dropdown Menu | `dropdown-menu.tsx` | Clickable menus |
| Input | `input.tsx` | Text input fields |
| Label | `label.tsx` | Form labels |
| Skeleton | `skeleton.tsx` | Loading states |
| Sonner | `sonner.tsx` | Toast notifications |
| Table | `table.tsx` | Data tables |
| Tabs | `tabs.tsx` | Tab navigation |
| Tooltip | `tooltip.tsx` | Hover hints |

### Using Components

```jsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Form</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text..." />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  )
}
```

---

## Part 8: Real-Time Features

This project includes powerful real-time features using Supabase Realtime.

### Feature 1: Real-Time Chat

#### Hook: `src/hooks/use-realtime-chat.ts`

```typescript
import { supabase } from '../lib/supabase'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

export type ChatMessage = {
  id: string
  content: string
  createdAt: string
  user: {
    name: string
    image: string | null
  }
}

const EVENT_NAME = 'chat-message'

export const useRealtimeChat = ({
  roomName,
  username,
}: {
  roomName: string
  username: string
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const sendMessage = useCallback(
    (content: string) => {
      if (!channelRef.current || !content.trim()) return

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        user: {
          name: username,
          image: null,
        },
      }

      channelRef.current.send({
        type: 'broadcast',
        event: EVENT_NAME,
        payload: message,
      })

      setMessages((prev) => [...prev, message])
    },
    [username]
  )

  useEffect(() => {
    const channel = supabase.channel(roomName)

    channel
      .on('broadcast', { event: EVENT_NAME }, (data: { payload: ChatMessage }) => {
        if (data.payload.user.name === username) return
        setMessages((prev) => [...prev, data.payload])
      })
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          setIsConnected(true)
          channelRef.current = channel
        } else {
          setIsConnected(false)
          channelRef.current = null
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
    }
  }, [roomName, username])

  return { messages, sendMessage, isConnected }
}
```

#### Usage:

```jsx
const { messages, sendMessage, isConnected } = useRealtimeChat({
  roomName: 'my-chat-room',
  username: 'John'
})
```

### Feature 2: Real-Time Cursors

Shows other users' mouse cursors in real-time (like Figma/Google Docs).

#### Hook: `src/hooks/use-realtime-cursors.ts`

```typescript
import { supabase } from '../lib/supabase'
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

type CursorEventPayload = {
  position: { x: number; y: number }
  user: { id: number; name: string }
  color: string
  timestamp: number
}

export const useRealtimeCursors = ({
  roomName,
  username,
  throttleMs = 50,
}: {
  roomName: string
  username: string
  throttleMs?: number
}) => {
  const [cursors, setCursors] = useState<Record<string, CursorEventPayload>>({})
  // ... implementation tracks and broadcasts cursor positions
  return { cursors }
}
```

#### Usage:

```jsx
const { cursors } = useRealtimeCursors({
  roomName: 'my-room',
  username: 'John',
  throttleMs: 50
})

// Render cursors
{Object.values(cursors).map((cursor) => (
  <div
    key={cursor.user.id}
    style={{
      position: 'fixed',
      left: cursor.position.x,
      top: cursor.position.y,
      backgroundColor: cursor.color
    }}
  >
    {cursor.user.name}
  </div>
))}
```

### Feature 3: Real-Time Presence (Avatar Stack)

Shows who's currently viewing a page.

#### Hook: `src/hooks/use-realtime-presence-room.ts`

```typescript
import { supabase } from '../lib/supabase'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export type RealtimeUser = {
  id: string
  name: string
  image: string
}

export const useRealtimePresenceRoom = (roomName: string) => {
  const [users, setUsers] = useState<Record<string, RealtimeUser>>({})

  useEffect(() => {
    const room = supabase.channel(roomName)

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState()
        // Process presence state into users map
        setUsers(/* processed users */)
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await room.track({ name: 'John', image: '/avatar.jpg' })
        }
      })

    return () => room.unsubscribe()
  }, [roomName])

  return { users }
}
```

#### Usage:

```jsx
const { users } = useRealtimePresenceRoom('patient-123')

// Show who's viewing
<div>
  {Object.values(users).map(user => (
    <Avatar key={user.id} src={user.image} name={user.name} />
  ))}
</div>
```

---

## Part 9: Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"New Project"**
4. Import your repository
5. Configure environment variables:
   - `VITE_SUPABASE_URL` = `https://yourdomain.com`
   - `VITE_SUPABASE_ANON_KEY` = Your anon key
6. Click **Deploy**

### Option 2: Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click **"Add new site"** → **"Import an existing project"**
4. Connect to GitHub and select your repo
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables in Site settings
7. Deploy

### Option 3: Deploy to GitHub Pages (Free)

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
3. Set base path in `vite.config.js`:
   ```javascript
   base: '/your-repo-name/',
   ```
4. Run: `npm run deploy`

---

## Troubleshooting

### "Failed to fetch" Error

**Causes:**
1. Wrong Supabase URL (shouldn't include port with nginx proxy)
2. Firewall blocking connections
3. Docker containers not running

**Solutions:**
1. Use `https://yourdomain.com` without port
2. Check both xCloud AND cloud provider firewalls
3. Verify Docker containers are running in xCloud

### "Kong Error - No API key found"

This is actually SUCCESS! Your API is working. The Supabase client library automatically adds the API key.

### "Connection Timed Out"

**Causes:**
1. Firewall not configured
2. Docker binding to localhost only

**Solutions:**
1. Configure both firewalls (see Step 1.5)
2. Set up nginx reverse proxy (see Step 1.4)

### Components Not Styled Correctly

**Solutions:**
1. Make sure Tailwind CSS is imported in `main.jsx`
2. Check that `tailwindcss` is in `vite.config.js` plugins
3. Verify CSS variables are defined

### Realtime Not Connecting

**Solutions:**
1. Check that the Realtime nginx location is configured
2. Verify WebSocket upgrade headers are in nginx config
3. Check browser console for connection errors

---

## Quick Reference

### File Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── auth/            # Authentication components
│   ├── realtime-chat.tsx
│   ├── realtime-cursors.tsx
│   └── realtime-avatar-stack.tsx
├── contexts/
│   └── AuthContext.jsx
├── hooks/
│   ├── use-realtime-chat.ts
│   ├── use-realtime-cursors.ts
│   └── use-realtime-presence-room.ts
├── lib/
│   ├── supabase.js
│   └── utils.ts
├── App.jsx
└── main.jsx
```

### Key URLs

| Resource | URL |
|----------|-----|
| Supabase API | `https://yourdomain.com` (via nginx) |
| Supabase Dashboard | `https://yourdomain.com:18010` |
| Your App | Your Vercel/deployment URL |

### Environment Variables

```env
VITE_SUPABASE_URL=https://yourdomain.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

### Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Summary

This guide covered:

1. **React Project Setup** - Creating a Vite project with proper structure
2. **Tailwind CSS** - Installing and configuring CSS framework
3. **Shadcn UI** - Adding beautiful, accessible UI components
4. **Supabase Connection** - Connecting your app to the backend
5. **Authentication** - User login/signup system
6. **Real-Time Features** - Chat, cursors, and presence
7. **Deployment** - Getting your app live

You now have a complete, modern web application stack!

---

## What's Next?

As this wiki grows, additional guides will be added for:
- Database schema design and migrations
- Advanced real-time patterns
- File storage and uploads
- Edge functions
- Testing strategies
- Performance optimization

Check the [Wiki Home](../WIKI.md) for the latest documentation.

---

> **Navigation**: [Wiki Home](../WIKI.md) | [Step 1: Infrastructure Setup](./STEP_1_INFRASTRUCTURE.md) | **Step 2**

---

*Last updated: January 15, 2026*
*Created with Claude Code assistance*
