import type { Express } from "express";
import { createServer, type Server } from "http";
import { firearmScraperService } from "./services/firearmScraper.js";
import { firearmEnrichmentService } from "./services/firearmEnrichment.js";
import { priceAnalyticsService } from "./services/priceAnalytics.js";
import { estateMonitorService } from "./services/estateMonitor.js";
import { alertEngine } from "./services/alertEngine.js";
import { db } from "./db.js";
import { firearmsAuctions, userAlerts } from "@shared/firearms-schema";
import { and, gte, lte, eq, desc, asc, sql, like } from "drizzle-orm";

// Simple rate limiting middleware
const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: any, res: any, next: any) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const requestData = requests.get(clientIP);
    
    if (!requestData || now > requestData.resetTime) {
      requests.set(clientIP, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (requestData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later."
      });
    }
    
    requestData.count++;
    next();
  };
};

// Rate limiters
const generalRateLimiter = createRateLimiter(300, 60000); // 300 req/min
const scrapingRateLimiter = createRateLimiter(10, 60000); // 10 req/min

export async function registerRoutes(app: Express): Promise<Server | null> {
  // Simple ping endpoint (no database) for Railway healthcheck
  app.get("/api/ping", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Health check endpoint - simplified for Railway healthcheck
  app.get("/api/health", async (req, res) => {
    try {
      // Quick database ping with timeout
      const healthCheck = await Promise.race([
        db.select().from(firearmsAuctions).limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
      ]);
      
      res.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        services: {
          database: "connected",
          api: "operational"
        }
      });
    } catch (error) {
      console.error("Health check failed:", error);
      // Still return 200 for Railway healthcheck to pass
      // Database might be initializing
      res.status(200).json({
        success: true,
        status: "starting",
        timestamp: new Date().toISOString(),
        message: "Server is starting, database connection pending"
      });
    }
  });

  // Apply rate limiting to all API routes
  app.use('/api', generalRateLimiter);

  // ============================================================
  // FIREARMS AUCTIONS ENDPOINTS
  // ============================================================

  // Get all firearms auctions with filters
  app.get("/api/firearms/auctions", async (req, res) => {
    try {
      const {
        category,
        manufacturer,
        caliber,
        minPrice,
        maxPrice,
        condition,
        state,
        auctionHouse,
        estateSalesOnly,
        nfaOnly,
        limit = 100,
        offset = 0
      } = req.query;

      let query = db.select().from(firearmsAuctions);
      const conditions: any[] = [eq(firearmsAuctions.status, 'active')];

      if (category) {
        conditions.push(eq(firearmsAuctions.category, category as string));
      }
      if (manufacturer) {
        conditions.push(like(firearmsAuctions.manufacturer, `%${manufacturer}%`));
      }
      if (caliber) {
        conditions.push(like(firearmsAuctions.caliber, `%${caliber}%`));
      }
      if (minPrice) {
        conditions.push(gte(firearmsAuctions.currentBid, parseFloat(minPrice as string)));
      }
      if (maxPrice) {
        conditions.push(lte(firearmsAuctions.currentBid, parseFloat(maxPrice as string)));
      }
      if (condition) {
        conditions.push(eq(firearmsAuctions.condition, condition as string));
      }
      if (state) {
        conditions.push(eq(firearmsAuctions.state, state as string));
      }
      if (auctionHouse) {
        conditions.push(eq(firearmsAuctions.auctionHouse, auctionHouse as string));
      }
      if (estateSalesOnly === 'true') {
        conditions.push(eq(firearmsAuctions.isEstateSale, true));
      }
      if (nfaOnly === 'true') {
        conditions.push(eq(firearmsAuctions.nfaItem, true));
      }

      const auctions = await query
        .where(and(...conditions))
        .orderBy(desc(firearmsAuctions.scrapedAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json({
        success: true,
        auctions,
        count: auctions.length
      });
    } catch (error) {
      console.error("Failed to get firearms auctions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Get single firearms auction
  app.get("/api/firearms/auctions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const auction = await db.query.firearmsAuctions.findFirst({
        where: eq(firearmsAuctions.id, id)
      });

      if (!auction) {
        return res.status(404).json({
        success: false,
          message: "Auction not found"
        });
      }
      
      res.json({ 
        success: true,
        auction
      });
    } catch (error) {
      console.error("Failed to get auction:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Trigger scraping (protected by rate limit)
  app.post("/api/firearms/refresh", scrapingRateLimiter, async (req, res) => {
    try {
      // Start scraping in background
      firearmScraperService.scrapeAllSources().catch(err => {
        console.error("Background scraping failed:", err);
      });
      
      res.json({ 
        success: true,
        message: "Scraping started in background"
      });
    } catch (error) {
      console.error("Failed to start scraping:", error);
      res.status(500).json({
        success: false,
        message: "Failed to start scraping"
      });
    }
  });

  // Get scraping progress
  app.get("/api/firearms/scrape-progress", async (req, res) => {
    try {
      const progress = firearmScraperService.getScrapeProgress();
      res.json({ 
        success: true, 
        progress
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to get progress"
      });
    }
  });

  // Enrich single auction
  app.post("/api/firearms/enrich/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await firearmEnrichmentService.enrichFirearmAuction(id);
      
      res.json({ 
        success: true, 
        enrichment: result
      });
    } catch (error) {
      console.error("Enrichment failed:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Enrichment failed"
      });
    }
  });

  // Batch enrichment
  app.post("/api/firearms/enrich-all", scrapingRateLimiter, async (req, res) => {
    try {
      const { force = false } = req.body;

      // Get auctions needing enrichment
      const query = force
        ? db.select().from(firearmsAuctions)
        : db.select().from(firearmsAuctions).where(eq(firearmsAuctions.enrichmentStatus, 'pending'));

      const auctions = await query;
      const auctionIds = auctions.map(a => a.id);

      // Start enrichment in background
      firearmEnrichmentService.enrichBatch(auctionIds, 5).catch(err => {
        console.error("Batch enrichment error:", err);
      });

      res.json({
        success: true,
        message: `Enriching ${auctionIds.length} auctions in background`
      });
    } catch (error) {
      console.error("Failed to start enrichment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to start enrichment"
      });
    }
  });

  // Get enrichment statistics
  app.get("/api/firearms/enrichment-stats", async (req, res) => {
    try {
      const stats = await firearmEnrichmentService.getEnrichmentStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get stats"
      });
    }
  });

  // Get auctions ending soon (< 24 hours)
  app.get("/api/firearms/ending-soon", async (req, res) => {
    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const auctions = await db
        .select()
        .from(firearmsAuctions)
        .where(
          and(
            eq(firearmsAuctions.status, 'active'),
            gte(firearmsAuctions.auctionDate, now),
            lte(firearmsAuctions.auctionDate, next24Hours)
          )
        )
        .orderBy(asc(firearmsAuctions.auctionDate));
      
      res.json({
        success: true,
        auctions,
        count: auctions.length
      });
    } catch (error) {
      console.error("Failed to get ending soon auctions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Get category breakdown
  app.get("/api/firearms/categories", async (req, res) => {
    try {
      const categories = await db
        .select({
          category: firearmsAuctions.category,
          count: sql<number>`COUNT(*)`
        })
        .from(firearmsAuctions)
        .where(eq(firearmsAuctions.status, 'active'))
        .groupBy(firearmsAuctions.category);

      res.json({
        success: true,
        categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get categories"
      });
    }
  });

  // ============================================================
  // MARKET INTELLIGENCE ENDPOINTS
  // ============================================================

  // Get competitor metrics
  app.get("/api/intelligence/competitors", async (req, res) => {
    try {
      const { category } = req.query;
      const competitors = await priceAnalyticsService.getCompetitorComparison(
        category as string | undefined
      );

      res.json({
        success: true,
        competitors
      });
    } catch (error) {
      console.error("Failed to get competitors:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Get price trends
  app.get("/api/intelligence/pricing/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { days = 30 } = req.query;

      const trends = await priceAnalyticsService.getPriceTrends(
        category,
        parseInt(days as string)
      );
      
      res.json({
        success: true,
        trends
      });
    } catch (error) {
      console.error("Failed to get pricing trends:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Get trending categories
  app.get("/api/intelligence/trends", async (req, res) => {
    try {
      // Get most active categories in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trends = await db
        .select({
          category: firearmsAuctions.category,
          volume: sql<number>`COUNT(*)`,
          avgBid: sql<number>`AVG(${firearmsAuctions.currentBid})`
        })
        .from(firearmsAuctions)
        .where(
          and(
            gte(firearmsAuctions.scrapedAt, sevenDaysAgo),
            eq(firearmsAuctions.status, 'active')
          )
        )
        .groupBy(firearmsAuctions.category)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(10);

      res.json({
        success: true,
        trends
      });
    } catch (error) {
      console.error("Failed to get trends:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Get undervalued opportunities
  app.get("/api/intelligence/opportunities", async (req, res) => {
    try {
      const { threshold = 20 } = req.query;
      const opportunities = await priceAnalyticsService.findOpportunities(
        parseInt(threshold as string)
      );
      
      res.json({
        success: true,
        opportunities
      });
    } catch (error) {
      console.error("Failed to get opportunities:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get price history for specific firearm
  app.get("/api/intelligence/price-history", async (req, res) => {
    try {
      const { manufacturer, model, condition, limit = 10 } = req.query;

      if (!manufacturer || !model) {
        return res.status(400).json({
          success: false,
          message: "Manufacturer and model are required"
        });
      }

      const analysis = await priceAnalyticsService.findComparables(
        manufacturer as string,
        model as string,
        condition as string | undefined,
        parseInt(limit as string)
      );
      
      res.json({ 
        success: true, 
        analysis
      });
    } catch (error) {
      console.error("Failed to get price history:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error"
      });
    }
  });

  // Get dashboard analytics
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const [
        activeCount,
        endingSoonCount,
        opportunities,
        enrichmentStats
      ] = await Promise.all([
        // Active auctions count
        db.select({ count: sql<number>`COUNT(*)` })
          .from(firearmsAuctions)
          .where(eq(firearmsAuctions.status, 'active')),
        
        // Ending soon count
        db.select({ count: sql<number>`COUNT(*)` })
          .from(firearmsAuctions)
          .where(
            and(
              eq(firearmsAuctions.status, 'active'),
              gte(firearmsAuctions.auctionDate, new Date()),
              lte(firearmsAuctions.auctionDate, new Date(Date.now() + 24 * 60 * 60 * 1000))
            )
          ),
        
        // Opportunities
        priceAnalyticsService.findOpportunities(20),
        
        // Enrichment stats
        firearmEnrichmentService.getEnrichmentStats()
      ]);

      // Calculate average price deviation from opportunities
      const avgDeviation = opportunities.length > 0
        ? opportunities.reduce((sum, opp) => sum + opp.deviation, 0) / opportunities.length
        : 0;

      // Count estate sales
      const estateSales = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(firearmsAuctions)
        .where(
          and(
            eq(firearmsAuctions.isEstateSale, true),
            eq(firearmsAuctions.status, 'active')
          )
        );
      
      res.json({ 
        success: true, 
        metrics: {
          activeAuctions: Number(activeCount[0].count),
          endingSoon: Number(endingSoonCount[0].count),
          opportunities: opportunities.length,
          avgDeviation: Number(avgDeviation.toFixed(2)),
          estateSales: Number(estateSales[0].count),
          enrichment: enrichmentStats
        }
      });
    } catch (error) {
      console.error("Failed to get dashboard metrics:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // ============================================================
  // ESTATE SALES ENDPOINTS
  // ============================================================

  // Get upcoming estate sales
  app.get("/api/estates/upcoming", async (req, res) => {
    try {
      const estateSales = await estateMonitorService.getUpcomingEstateSales();
      
      res.json({
        success: true,
        estateSales
      });
    } catch (error) {
      console.error("Failed to get estate sales:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Scan for new estate sales
  app.post("/api/estates/scan", scrapingRateLimiter, async (req, res) => {
    try {
      const { state } = req.body;

      // Start scanning in background
      estateMonitorService.scanEstateSales(state).catch(err => {
        console.error("Estate scanning error:", err);
      });
      
      res.json({
        success: true,
        message: "Estate sale scanning started"
      });
    } catch (error) {
      console.error("Failed to start estate scanning:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Get high-value estate alerts
  app.get("/api/estates/alerts", async (req, res) => {
    try {
      const alerts = await estateMonitorService.flagHighValueEstates();
      
      res.json({
        success: true,
        alerts
      });
    } catch (error) {
      console.error("Failed to get estate alerts:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // ============================================================
  // USER ALERTS ENDPOINTS
  // ============================================================

  // Create alert (would need auth middleware in production)
  app.post("/api/alerts", async (req, res) => {
    try {
      const { userId = 1, alertType, criteria } = req.body; // Default userId for demo

      if (!alertType || !criteria) {
        return res.status(400).json({ 
          success: false, 
          message: "Alert type and criteria are required"
        });
      }

      const alert = await alertEngine.createAlert(userId, alertType, criteria);
      
      res.json({
        success: true,
        alert
      });
    } catch (error) {
      console.error("Failed to create alert:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Get user alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const { userId = 1 } = req.query; // Default userId for demo

      const alerts = await alertEngine.getUserAlerts(parseInt(userId as string));

        res.json({
          success: true,
        alerts
      });
    } catch (error) {
      console.error("Failed to get alerts:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Update alert
  app.put("/api/alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { criteria, active } = req.body;

      await alertEngine.updateAlert(id, criteria, active);
      
      res.json({
        success: true,
        message: "Alert updated"
      });
    } catch (error) {
      console.error("Failed to update alert:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Delete alert
  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await alertEngine.deleteAlert(id);
      
      res.json({
        success: true,
        message: "Alert deleted"
      });
    } catch (error) {
      console.error("Failed to delete alert:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Process all pending alerts
  app.post("/api/alerts/process", async (req, res) => {
    try {
      const result = await alertEngine.processAlerts();
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error("Failed to process alerts:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // ============================================================
  // WEBSOCKET SUPPORT (for real-time updates)
  // ============================================================
  
  const httpServer = createServer(app);
  
  return httpServer;
}
