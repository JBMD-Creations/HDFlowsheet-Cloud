# HDFlowsheet Deployment Guide

## Quick Deploy to Vercel (Recommended - 2 minutes)

Vercel offers free hosting perfect for this app.

### Step 1: Create Vercel Account
1. Go to https://vercel.com/signup
2. Sign up with your GitHub account (easiest option)

### Step 2: Import Your Repository
1. Once logged in, click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. Find and select your **`Supabase`** repository
4. Vercel will auto-detect it's a Vite app

### Step 3: Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

These should be auto-filled, but verify them.

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes for the build
3. You'll get a live URL like: `https://your-project.vercel.app`

### Step 5: Access Your App
Your HDFlowsheet app is now live! Share the URL with your team.

---

## Alternative: Deploy to Netlify (Also Free)

### Step 1: Create Netlify Account
1. Go to https://netlify.com
2. Sign up with GitHub

### Step 2: Import Repository
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your **`Supabase`** repository

### Step 3: Configure Build
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Step 4: Deploy
Click **"Deploy site"** and wait for build to complete.

---

## Alternative: GitHub Pages (Free, No Sign-up)

### Option 1: Automatic via Actions (Recommended)

I've already set up the GitHub Actions workflow in this repo. Just:

1. Go to your repo: https://github.com/Aventerica89/Supabase
2. Click **Settings** → **Pages**
3. Under **Source**, select **"GitHub Actions"**
4. The app will build and deploy automatically on every push
5. Your app will be at: `https://aventerica89.github.io/Supabase/`

### Option 2: Manual Build & Deploy

```bash
# Build the app
npm run build

# Install gh-pages package
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

---

## What's Included in the Deployed App?

✅ **Patient Charting**
- Add/edit/delete patients
- QA checklists (Pre/30min/Meds/Post)
- Weight & UF management with calculations
- Treatment time tracking
- Notes per patient
- Shift tabs (1st/2nd/3rd)
- Pod grouping

✅ **Data Persistence**
- All data saves to browser localStorage
- Survives page reloads
- No database needed (yet)

✅ **Theme System**
- 5 professional color themes
- Clinical Blue (default)
- Slate, Warm, Navy, Ultra-Light

---

## Coming Soon

🚧 **Operations Module**
- Checklists management
- Labs tracking
- Snippets manager

🚧 **Reports**
- End of Shift Report (EOSR) generator

🚧 **Excel Import**
- Upload patient lists from Excel

🚧 **Supabase Integration**
- Cloud database storage
- Multi-user support
- Real-time sync

---

## Troubleshooting

### Build Fails
If deployment fails, check:
1. All dependencies are in `package.json`
2. No syntax errors (run `npm run build` locally first)
3. All imports are correct

### Can't Access Deployed Site
1. Check if build completed successfully
2. Verify the deployment URL
3. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Data Not Saving
- Data saves to localStorage (browser storage)
- Each browser/device has separate data
- Clearing browser data will erase patients

---

## Need Help?

Create an issue in the GitHub repo or contact the development team.

## Next Steps

Once deployed:
1. Test adding a patient
2. Fill out QA checklist
3. Enter weights and times
4. Try different themes in Settings (coming soon)

Enjoy your new HDFlowsheet app! 🎉
