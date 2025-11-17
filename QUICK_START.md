# GunScope AI - Quick Start Guide

## ✅ What's Already Done

### Code & Configuration (100% Complete)
- ✅ Complete codebase migrated and adapted
- ✅ All agricultural components removed
- ✅ Firearms-specific services built
- ✅ Tactical UI theme implemented
- ✅ API endpoints complete
- ✅ Database schema designed
- ✅ Scripts created
- ✅ `.env` file created with your API keys
- ✅ Deployed to GitHub: https://github.com/dallyp22/GunScopeAI

### Your API Keys (Configured)
- ✅ OpenAI API Key
- ✅ Firecrawl API Key
- ✅ Mapbox Access Token
- ✅ Mapbox Style URL

---

## 🚀 5-Minute Deployment

### Step 1: Create Neon Database (2 minutes)

1. Go to https://console.neon.tech
2. Click "Create Project"
3. Name: `GunScope AI`
4. Region: Choose closest to you
5. Copy the connection string
6. **Update your `.env` file:**
   ```env
   DATABASE_URL=postgresql://[paste-your-neon-connection-string]
   ```

### Step 2: Deploy Backend to Railway (2 minutes)

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select: `dallyp22/GunScopeAI`
4. Railway automatically detects `railway.toml`
5. Click "Add variables" and paste (use your actual keys from .env file):
   ```
   DATABASE_URL=postgresql://[your-neon-connection-string]
   OPENAI_API_KEY=[your-openai-key-from-.env]
   FIRECRAWL_API_KEY=[your-firecrawl-key-from-.env]
   VITE_MAPBOX_PUBLIC_KEY=[your-mapbox-key-from-.env]
   NODE_ENV=production
   PORT=5001
   ```
   
   **Note**: All your actual API keys are in your local `.env` file
6. Railway will build and deploy
7. **Copy your Railway URL** (e.g., `gunscope-production.up.railway.app`)

### Step 3: Deploy Frontend to Vercel (1 minute)

1. Go to https://vercel.com/new
2. Import Git Repository: `dallyp22/GunScopeAI`
3. Framework: Vite (auto-detected)
4. Build Command: `npm run build`
5. Output Directory: `client/dist`
6. Environment Variables (use your actual keys from .env):
   ```
   VITE_MAPBOX_PUBLIC_KEY=[your-mapbox-key-from-.env]
   VITE_API_URL=https://[your-railway-url]
   ```
7. Click "Deploy"

### Step 4: Update vercel.json

After you get your Railway URL, update this line in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://[YOUR-RAILWAY-URL]/api/:path*"
    }
  ]
}
```

Then redeploy on Vercel.

### Step 5: Initialize Database

From your local terminal:

```bash
cd /Users/dallas/GunScope/GunScopeAI

# Push schema to database
npm run db:push

# Run setup script (creates indexes)
npm run setup-database
```

### Step 6: Collect Initial Data

```bash
# Scrape all 35 auction sources (takes 5-10 min)
npm run firearms:scrape

# Enrich with AI (takes 10-20 min depending on volume)
npm run firearms:enrich

# View results
npm run firearms:recent
```

---

## 🎯 Test Your Deployment

1. Visit your Vercel URL
2. You should see the tactical analytics dashboard
3. Check that all panels load:
   - ✅ Top metrics bar
   - ✅ Opportunities panel
   - ✅ Live auction feed
   - ✅ Price charts
   - ✅ Competitor intel

---

## 🛠️ Useful Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start local dev server (localhost:5001)

# Database
npm run db:push         # Update database schema
npm run setup-database   # Initialize database

# Data Collection
npm run firearms:scrape          # Scrape all sources
npm run firearms:enrich          # AI enrichment
npm run firearms:enrich:force    # Re-enrich everything
npm run firearms:recent          # View recent auctions

# Status Check
npm run firearms:enrich:status   # Check enrichment progress
```

---

## 📊 Expected Results After Initial Scrape

Based on 35 auction sources:
- **Expected auctions**: 200-500 firearms auctions
- **Enrichment success rate**: ~95%
- **Processing time**: 15-30 minutes total
- **API cost**: ~$2-5 for initial enrichment

---

## 🔍 Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` in Railway matches Neon
- Check Neon database is active

### "Firecrawl rate limit"
- Firecrawl has request limits
- Script automatically handles rate limiting
- May take longer with free tier

### "Enrichment failing"
- Check OpenAI API key is valid
- Verify you have GPT-4o access
- Check API usage limits

### "No data showing in dashboard"
- Run `npm run firearms:scrape` first
- Wait for enrichment to complete
- Check browser console for API errors

---

## 📝 URLs to Bookmark

- **GitHub Repo**: https://github.com/dallyp22/GunScopeAI
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Console**: https://console.neon.tech

---

## 🎉 You're All Set!

GunScope AI is ready to deploy. The entire tactical analytics platform is built and configured with your API keys. 

**Total time to deploy: ~15 minutes + initial data collection**

Follow the 6 steps above and you'll have a live, production-ready firearms auction intelligence platform!

---

**Questions?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

**Ready to go live!** 🎯🔫

