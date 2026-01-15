# HD Flowsheet & QA Tracker - React Edition

A modern React-based hemodialysis patient tracking and QA management system.

## ✨ What's Working Right Now

✅ **Patient Management** - Add, edit, delete patients with full details
✅ **QA Checklists** - 9 checkboxes (Pre, 30min, Meds, Abx/IDPN, STAT Labs, etc.)
✅ **Weight & UF** - Auto-calculates UF from pre/post weights
✅ **Treatment Times** - Start/end time tracking
✅ **Notes** - Per-patient notes
✅ **Shifts** - 1st/2nd/3rd shift tabs with counts
✅ **Pod Grouping** - Organize by technician
✅ **Auto-Save** - Everything saves to browser automatically
✅ **Themes** - 5 professional color schemes

## 🚀 Deploy Your App (2 Minutes!)

### Easiest: Vercel (Recommended)
1. Go to **https://vercel.com/signup** and sign in with GitHub
2. Click **"Add New..." → "Project"**
3. Import your **Supabase** repository
4. Click **"Deploy"**
5. Done! You get a live URL

**Full instructions**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 💻 Or Run Locally

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## 📖 How to Use

1. **Add Patient**: Click "+ Add Patient" button
2. **Fill Details**: Enter name (initials), chair, section, shift
3. **Expand Card**: Click any patient to see full details
4. **Check QA Items**: Click checkboxes as you complete tasks
5. **Enter Data**: Add weights, times, notes
6. **Auto-Save**: Everything saves automatically!

## 📁 What's Included

```
✅ Patient Charting (Working!)
   - Add/edit/delete patients
   - QA checklists
   - Weight & UF calculations
   - Treatment times
   - Notes

🚧 Operations (Coming Soon)
   - Checklists management
   - Labs tracking
   - Snippets

🚧 Reports (Coming Soon)
   - End of Shift Report generator

🚧 Excel Import (Coming Soon)
   - Upload patient lists
```

## 🗄️ Database Setup (Optional)

For cloud storage with Supabase:
1. Run SQL from `supabase_schema.sql` in your Supabase SQL Editor
2. Uncomment Supabase integration code (coming in next update)

Currently uses browser localStorage - no database needed!

## 🎨 Features

- **5 Themes**: Clinical Blue, Slate, Warm, Navy, Ultra-Light
- **Shift Tabs**: 1st, 2nd, 3rd with patient counts
- **Pod Grouping**: Organize by technician
- **Status Pills**: Visual QA completion indicators
- **Auto UF Calc**: Calculates from pre/post weights
- **Expandable Cards**: Show/hide patient details

## 🚧 Roadmap

**Next Up:**
- Excel import for patient lists
- Settings modal (tech management)
- Theme selector UI
- Operations module
- EOSR reports

**Later:**
- Supabase cloud sync
- Multi-user support
- Mobile app
- Offline mode

## 📊 Tech Stack

- React 18.2 + Vite
- Supabase (PostgreSQL)
- CSS with theme system
- localStorage for data

## 📝 Build Stats

- Bundle: 163 KB (51 KB gzipped)
- Build time: ~800ms
- Zero config needed!

## 💡 Need Help?

- Deployment help: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Architecture details: See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
- Issues: Open a GitHub Issue

---

**Built for dialysis care teams** ❤️

Version: 0.1.0 | Jan 13, 2026
