import { firecrawlService } from './firecrawl.js';
import { db } from '../db.js';
import { firearmsAuctions } from '@shared/firearms-schema';
import { eq } from 'drizzle-orm';
import { scraperDiagnosticsService } from './scraperDiagnostics.js';
import { addToQueue } from './enrichmentQueue.js';

// Scraper statistics interface for diagnostics
export interface ScraperStats {
  scrapeId: string;
  sourceName: string;
  discoveredUrls: number;
  processedUrls: number;
  successfulSaves: number;
  failedScrapes: number;
  failedSaves: number;
  duration: number;
  timestamp: Date;
  missingUrls: string[];
}

// Extraction schema for firearms auction data
const firearmAuctionSchema = {
  type: "object",
  properties: {
    auctions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          url: { type: "string" },
          auction_date: { type: "string" },
          manufacturer: { type: "string" },
          model: { type: "string" },
          caliber: { type: "string" },
          category: { type: "string" },
          condition: { type: "string" },
          lot_number: { type: "string" },
          starting_bid: { type: "number" },
          current_bid: { type: "number" },
          estimate_low: { type: "number" },
          estimate_high: { type: "number" },
          location: { type: "string" },
          city: { type: "string" },
          state: { type: "string" }
        },
        required: ["title", "url"]
      }
    }
  },
  required: ["auctions"]
};

export class FirearmScraperService {
  // Stats from last scrape run
  private lastScrapeStats: ScraperStats[] = [];
  private currentScrapeId: string = '';
  
  // Real-time progress tracking
  private scrapeProgress = {
    isActive: false,
    currentSource: '',
    completedSources: 0,
    totalSources: 35,
    currentSourceProgress: 0
  };

  // Source configurations for 35 firearms auction houses
  private sources = [
    // Texas
    { name: 'Heritage Auctions (Arms & Armor)', state: 'TX', city: 'Dallas', url: 'https://historical.ha.com/' },
    { name: 'Western Sportsman LLC', state: 'TX', city: 'Fort Worth', url: 'https://www.westernsportsman.auction/' },
    { name: 'Warren Liquidation Auction & Resale (WLAR)', state: 'TX', city: 'Fort Worth', url: 'https://www.warrenliquidation.com/auction/list' },
    { name: 'Rock Island Auction Company – Texas Facility', state: 'TX', city: 'Bedford (DFW)', url: 'https://www.rockislandauction.com/' },
    { name: 'Texas Auction Realty', state: 'TX', city: 'Weatherford (DFW West)', url: 'https://www.texasauctionrealty.com/' },
    { name: 'Lone Star Auctioneers (LSO)', state: 'TX', city: 'Arlington (DFW)', url: 'https://www.lso.cc/' },
    { name: 'HiBid – Dallas-area Firearms', state: 'TX', city: 'Dallas (area hub)', url: 'https://dallas.hibid.com/auctions/40228/sporting-goods/firearms---weapons' },
    { name: 'Right To Bear Arms Auction Co.', state: 'TX', city: 'Chico (North TX)', url: 'https://www.r2baauctions.com/' },
    { name: 'Central Texas Auction Services', state: 'TX', city: 'Belton / Central TX', url: 'https://www.centraltexasauctionservices.com/' },
    { name: 'A & S Auction Company', state: 'TX', city: 'Waco', url: 'https://asauctions.com/' },
    { name: 'Brand Used Works', state: 'TX', city: 'Henderson (East TX)', url: 'https://hibid.com/company/63519/brand-used-works' },
    { name: 'Asset Marketing Pros / Trinity Auction Gallery', state: 'TX', city: 'Trinity (East TX)', url: 'https://amp-tag.com/' },
    { name: 'TexMax Auctions', state: 'TX', city: 'Houston', url: 'https://www.texmax.net/' },
    { name: 'Webster\'s Auction Palace', state: 'TX', city: 'Humble (Houston)', url: 'https://webstersauction.com/' },
    { name: 'Lewis & Maese Antiques & Auctions', state: 'TX', city: 'Houston', url: 'https://www.lmauctionco.com/' },
    { name: 'Burley Auction Group', state: 'TX', city: 'New Braunfels (Hill Country)', url: 'https://www.burleyauction.com/' },
    { name: 'Vogt Auction', state: 'TX', city: 'San Antonio', url: 'https://vogtauction.com/category/firearms-militaria' },
    { name: 'Dury\'s Guns (Auctions)', state: 'TX', city: 'San Antonio', url: 'https://durysguns.com/' },
    { name: 'South Texas Auction Company, LLC', state: 'TX', city: 'Brownsville (South TX)', url: 'https://hibid.com/company/138293/south-texas-auction-company--llc' },
    { name: 'René Bates Auctioneers', state: 'TX', city: 'Houston / Statewide', url: 'https://www.renebates.com/' },
    { name: 'Clark Auction Company', state: 'TX', city: 'Belton / Temple', url: 'https://www.clarkauctioncompany.com/' },
    { name: 'Spanky\'s Online Auction', state: 'TX', city: 'Lubbock', url: 'https://spankysonline.com/' },
    { name: 'Ward Real Estate & Auction', state: 'TX', city: 'Corpus Christi / South TX', url: 'https://www.wardrealestateauctions.com/' },
    { name: 'Canyon Auctions', state: 'TX', city: 'Amarillo / Canyon', url: 'https://www.canyonauctions.com/' },
    
    // Oklahoma
    { name: 'Chupps Auction & Real Estate', state: 'OK', city: 'Pawnee / Tulsa area', url: 'https://chuppsauction.hibid.com/' },
    { name: 'Wiggins Auctioneers', state: 'OK', city: 'Enid / North OK', url: 'https://www.wigginsauctioneers.com/' },
    { name: 'Smith & Co. Auction & Realty', state: 'OK', city: 'Woodward / NW OK', url: 'https://www.smithcoauctions.com/' },
    { name: 'Pickens Auction', state: 'OK', city: 'Mustang / OKC', url: 'https://www.pickensauctions.com/' },
    { name: 'Aline Auction', state: 'OK', city: 'Aline / NW OK', url: 'https://www.alineauction.com/' },
    { name: 'Ball Auction Service', state: 'OK', city: 'Stillwater', url: 'https://ballauctionservice.com/' },
    
    // Louisiana
    { name: 'Bonnette Auctions', state: 'LA', city: 'Alexandria', url: 'https://bonnetteauctions.com/' },
    { name: 'Lawler Auction Company', state: 'LA', city: 'Shreveport', url: 'https://www.lawlerauction.com/' },
    { name: 'Henderson Auctions', state: 'LA', city: 'Baton Rouge / Livingston', url: 'https://www.hendersonauctions.com/' },
    { name: 'Stokes & Hubbell Auctioneers', state: 'LA', city: 'Lafayette / Acadiana', url: 'https://www.stokesandhubbell.com/' }
  ];

  // Get stats from last scrape
  getLastScrapeStats(): ScraperStats[] {
    return this.lastScrapeStats;
  }
  
  // Get current scrape progress
  getScrapeProgress() {
    return this.scrapeProgress;
  }

  // Scrape all auction sources
  async scrapeAllSources() {
    // Generate unique scrape ID
    this.currentScrapeId = `scrape_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.lastScrapeStats = [];
    
    // Initialize progress tracking
    this.scrapeProgress = {
      isActive: true,
      currentSource: 'Starting...',
      completedSources: 0,
      totalSources: this.sources.length,
      currentSourceProgress: 0
    };
    
    const results = [];
    
    for (let i = 0; i < this.sources.length; i++) {
      const source = this.sources[i];
      try {
        // Update progress
        this.scrapeProgress.currentSource = source.name;
        this.scrapeProgress.completedSources = i;
        
        console.log(`Scraping ${source.name}...`);
        const auctions = await this.scrapeSingleSource(source);
        results.push(...auctions);
        console.log(`✅ ${source.name}: Found ${auctions.length} firearms auctions`);
        
        // Mark as completed
        this.scrapeProgress.completedSources = i + 1;
      } catch (error) {
        console.error(`❌ Failed to scrape ${source.name}:`, error instanceof Error ? error.message : error);
        this.scrapeProgress.completedSources = i + 1;
      }
    }
    
    console.log(`\n🎉 Total firearms auctions scraped: ${results.length}`);
    
    // Log diagnostics
    if (this.lastScrapeStats.length > 0) {
      scraperDiagnosticsService.logStats(this.lastScrapeStats);
      scraperDiagnosticsService.logMissingAuctions(this.lastScrapeStats);
      
      // Calculate and log coverage metrics
      const metrics = scraperDiagnosticsService.calculateCoverageMetrics(this.lastScrapeStats);
      console.log('\n📊 Coverage Summary:');
      metrics.forEach(m => {
        console.log(`  ${m.source}: ${m.coverage_percentage}% (${m.saved}/${m.discovered})`);
      });
    }
    
    // Mark scraping as complete
    this.scrapeProgress.isActive = false;
    
    return results;
  }

  // Scrape a single source
  private async scrapeSingleSource(source: any) {
    const startTime = Date.now();
    
    const stats: ScraperStats = {
      scrapeId: this.currentScrapeId,
      sourceName: source.name,
      discoveredUrls: 0,
      processedUrls: 0,
      successfulSaves: 0,
      failedScrapes: 0,
      failedSaves: 0,
      duration: 0,
      timestamp: new Date(),
      missingUrls: []
    };

    try {
      // Use Firecrawl to scrape the auction house
      const response = await firecrawlService.scrapeUrl(source.url, {
        formats: ['markdown', 'html'],
        wait: 2000
      });

      if (!response || !response.data) {
        stats.failedScrapes = 1;
        stats.duration = Date.now() - startTime;
        this.lastScrapeStats.push(stats);
        return [];
      }

      // Extract auction listings using Firecrawl's extract feature
      const extractedData = await firecrawlService.extractStructuredData(
        response.data.markdown || response.data.html || '',
        firearmAuctionSchema
      );

      const auctions = extractedData?.auctions || [];
      stats.discoveredUrls = auctions.length;
      stats.processedUrls = auctions.length;

      // Save auctions to database
      const savedAuctions = [];
      for (const auction of auctions) {
        try {
          // Check if auction already exists
          const existing = await db.select()
            .from(firearmsAuctions)
            .where(eq(firearmsAuctions.url, auction.url))
            .limit(1);

          if (existing.length === 0) {
            // Insert new auction
            const inserted = await db.insert(firearmsAuctions).values({
              title: auction.title,
              url: auction.url,
              sourceWebsite: source.name,
              description: auction.description || null,
              manufacturer: auction.manufacturer || null,
              model: auction.model || null,
              caliber: auction.caliber || null,
              category: auction.category || null,
              condition: auction.condition || null,
              lotNumber: auction.lot_number || null,
              startingBid: auction.starting_bid || null,
              currentBid: auction.current_bid || null,
              estimateLow: auction.estimate_low || null,
              estimateHigh: auction.estimate_high || null,
              city: auction.city || source.city || null,
              state: auction.state || source.state || null,
              auctionDate: auction.auction_date ? new Date(auction.auction_date) : null,
              enrichmentStatus: 'pending',
              status: 'active'
            }).returning();

            if (inserted.length > 0) {
              savedAuctions.push(inserted[0]);
              stats.successfulSaves++;
              
              // Queue for AI enrichment
              addToQueue(inserted[0].id);
            }
          } else {
            // Update existing auction
            await db.update(firearmsAuctions)
              .set({
                currentBid: auction.current_bid || existing[0].currentBid,
                updatedAt: new Date()
              })
              .where(eq(firearmsAuctions.id, existing[0].id));
            
            savedAuctions.push(existing[0]);
            stats.successfulSaves++;
          }
        } catch (saveError) {
          console.error(`Failed to save auction: ${auction.url}`, saveError);
          stats.failedSaves++;
          stats.missingUrls.push(auction.url);
        }
      }

      stats.duration = Date.now() - startTime;
      this.lastScrapeStats.push(stats);
      
      return savedAuctions;
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error);
      stats.failedScrapes = 1;
      stats.duration = Date.now() - startTime;
      this.lastScrapeStats.push(stats);
      return [];
    }
  }

  // Scrape a specific auction by URL
  async scrapeByUrl(url: string) {
    console.log(`Scraping single URL: ${url}`);
    
    try {
      const response = await firecrawlService.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        wait: 2000
      });

      if (!response || !response.data) {
        throw new Error('Failed to scrape URL');
      }

      // Use Firecrawl to extract structured data
      const extractedData = await firecrawlService.extractStructuredData(
        response.data.markdown || response.data.html || '',
        firearmAuctionSchema
      );

      const auctionData = extractedData?.auctions?.[0];
      
      if (!auctionData) {
        throw new Error('No auction data found at URL');
      }

      // Check if already exists
      const existing = await db.select()
        .from(firearmsAuctions)
        .where(eq(firearmsAuctions.url, url))
        .limit(1);

      let saved;
      if (existing.length === 0) {
        // Insert new
        const inserted = await db.insert(firearmsAuctions).values({
          title: auctionData.title,
          url: url,
          sourceWebsite: 'Manual Entry',
          description: auctionData.description || null,
          manufacturer: auctionData.manufacturer || null,
          model: auctionData.model || null,
          caliber: auctionData.caliber || null,
          category: auctionData.category || null,
          condition: auctionData.condition || null,
          lotNumber: auctionData.lot_number || null,
          startingBid: auctionData.starting_bid || null,
          currentBid: auctionData.current_bid || null,
          estimateLow: auctionData.estimate_low || null,
          estimateHigh: auctionData.estimate_high || null,
          city: auctionData.city || null,
          state: auctionData.state || null,
          auctionDate: auctionData.auction_date ? new Date(auctionData.auction_date) : null,
          enrichmentStatus: 'pending',
          status: 'active'
        }).returning();

        saved = inserted[0];
        
        // Queue for enrichment
        addToQueue(saved.id);
      } else {
        saved = existing[0];
      }

      return saved;
    } catch (error) {
      console.error('Failed to scrape URL:', error);
      throw error;
    }
  }
}

export const firearmScraperService = new FirearmScraperService();

