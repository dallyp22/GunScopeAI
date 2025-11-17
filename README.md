# GunScope AI - Firearms Auction Intelligence Platform

![GunScope AI](https://img.shields.io/badge/status-development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

A sophisticated AI-powered firearms auction intelligence platform for professional dealers. GunScope AI combines automated auction scraping, GPT-4o enrichment, market analytics, and competitive intelligence to provide comprehensive firearms auction data across TX, OK, and LA.

## 🎯 Features

### Dual-AI Pipeline
- **Stage 1: Firecrawl Scraping** - Reliable data acquisition from 35 auction sources
- **Stage 2: GPT-4o Enrichment** - Intelligent extraction of 40+ firearm-specific fields

### Core Capabilities
- **35 Auction Sources** - Comprehensive coverage across Texas, Oklahoma, and Louisiana
- **AI-Powered Enrichment** - Manufacturer, model, caliber, condition, rarity, provenance
- **Price Analytics** - Historical price tracking, comparable sales, opportunity detection
- **Competitive Intelligence** - Auction house performance metrics and market share analysis
- **Estate Sale Monitoring** - Automated detection of high-value firearms collections
- **Smart Alerts** - User-defined criteria matching with email/SMS notifications

### Market Intelligence
- Real-time auction monitoring
- Price trend analysis
- Undervalued item detection
- Auction house performance tracking
- Investment-grade opportunity identification

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon, Railway, or local)
- OpenAI API key
- Firecrawl API key
- Mapbox access token

### Installation

```bash
# Clone the repository
git clone https://github.com/dallyp22/GunScopeAI.git
cd GunScopeAI

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5001`

### Environment Variables

Create a `.env` file with the following:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@neon.tech/gunscope?sslmode=require

# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Firecrawl API Key (REQUIRED)
FIRECRAWL_API_KEY=fc-your-firecrawl-key-here

# Mapbox Public Key
VITE_MAPBOX_PUBLIC_KEY=pk.your-mapbox-token-here

# App URLs
VITE_API_URL=https://gunscope-api.railway.app
FRONTEND_URL=https://gunscope.vercel.app
```

## 📊 Data Schema

### Firearms Auctions
- **Identification**: Manufacturer, model, caliber, serial number, year
- **Condition**: Grade, bore condition, finish %, original parts, function
- **Categories**: Handgun, Rifle, Shotgun, Machine Gun, Antique, Military
- **Value Intelligence**: Provenance, rarity, desirability, investment grade
- **Legal**: Transfer type (FFL/C&R/NFA/Antique), restrictions
- **Auction Details**: House, lot number, bids, estimates
- **Estate Sales**: Collection size, notable items

### Price History
- Historical sales data for market analysis
- Manufacturer/model/condition tracking
- Auction house performance metrics

### User Alerts
- Customizable match criteria
- Email/SMS notification support
- Trigger tracking

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Maps**: MapLibre GL + Mapbox vector tiles
- **AI**: OpenAI GPT-4o
- **Scraping**: Firecrawl
- **Styling**: Tailwind CSS + shadcn/ui

### Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├─ components/  # UI components
│   │   ├─ pages/       # Page components
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── services/
│   │   ├── firearmScraper.ts      # Auction scraping
│   │   ├── firearmEnrichment.ts   # GPT-4o enrichment
│   │   ├── priceAnalytics.ts      # Market intelligence
│   │   ├── estateMonitor.ts       # Estate sale detection
│   │   └── alertEngine.ts         # User alerts
│   ├── routes.ts        # API endpoints
│   └── db.ts            # Database connection
├── shared/
│   └── firearms-schema.ts # Database schema
└── scripts/             # Utility scripts
```

## 🔌 API Endpoints

### Firearms Auctions
```
GET    /api/firearms/auctions          # List with filters
GET    /api/firearms/auctions/:id      # Single auction
POST   /api/firearms/refresh           # Trigger scrape
POST   /api/firearms/enrich/:id        # Enrich single
POST   /api/firearms/enrich-all        # Batch enrichment
GET    /api/firearms/ending-soon       # Ending < 24h
```

### Market Intelligence
```
GET    /api/intelligence/competitors   # Auction house metrics
GET    /api/intelligence/pricing/:cat  # Price trends
GET    /api/intelligence/trends        # Hot categories
GET    /api/intelligence/opportunities # Undervalued items
```

### Estate Sales
```
GET    /api/estates/upcoming           # Upcoming sales
POST   /api/estates/scan               # Trigger monitoring
GET    /api/estates/alerts             # High-value alerts
```

### User Alerts
```
POST   /api/alerts                     # Create alert
GET    /api/alerts                     # List alerts
PUT    /api/alerts/:id                 # Update alert
DELETE /api/alerts/:id                 # Delete alert
```

## 🎨 Tactical UI Theme

GunScope AI features a military/tactical HUD-inspired interface:
- **Dark backgrounds** with tactical green (#00ff41) accents
- **Scanline effects** for authentic HUD feel
- **Mission-control layout** with real-time feeds
- **Glowing text** and tactical borders
- **Professional dealer-focused** UX

## 📈 Auction Sources

### Texas (24 sources)
Heritage Auctions, Rock Island Auction, Western Sportsman, Warren Liquidation, Texas Auction Realty, Lone Star Auctioneers, Right To Bear Arms, Central Texas Auction, TexMax, Webster's Auction, Burley Auction, Vogt Auction, Dury's Guns, and more.

### Oklahoma (6 sources)
Chupps Auction, Wiggins Auctioneers, Smith & Co, Pickens Auction, Aline Auction, Ball Auction Service.

### Louisiana (4 sources)
Bonnette Auctions, Lawler Auction, Henderson Auctions, Stokes & Hubbell Auctioneers.

## 🚢 Deployment

### Production Build
```bash
npm run build
npm start
```

### Railway Deployment (Backend)
- Automatic PostgreSQL integration
- Environment variable management
- Configured via `railway.toml`

### Vercel Deployment (Frontend)
- Zero-config deployment
- API proxy to Railway backend
- Configured via `vercel.json`

## 🛠️ Development Scripts

```bash
npm run dev                    # Start development server
npm run build                  # Build frontend
npm run build:server           # Build backend
npm run db:push                # Push database schema
npm run firearms:scrape        # Scrape all sources
npm run firearms:enrich        # Enrich pending auctions
npm run firearms:enrich:status # Check enrichment status
```

## 🔐 Security & Compliance

- Rate limiting on all API endpoints
- Secure credential management
- FFL/NFA transfer requirement flagging
- State restriction warnings
- Graceful error handling

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **OpenAI** - GPT-4o AI enrichment
- **Firecrawl** - Reliable web scraping
- **Mapbox** - Vector tile infrastructure

---

**Built for professional firearms dealers**

**Status**: 🚧 Backend complete, Frontend in development

## Next Steps

1. Set up Neon PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Test scraping with provided sources
5. Build tactical-themed frontend components
6. Deploy to Railway (backend) and Vercel (frontend)

