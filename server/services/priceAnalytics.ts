import { db } from '../db.js';
import { priceHistory, firearmsAuctions, competitorMetrics } from '@shared/firearms-schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface PriceTrend {
  date: string;
  avgPrice: number;
  volume: number;
}

export interface ComparableSale {
  date: string;
  manufacturer: string;
  model: string;
  caliber: string;
  condition: string;
  salePrice: number;
  auctionHouse: string;
  sourceUrl: string;
}

export interface PriceAnalysis {
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  priceDeviation: number;
  sampleSize: number;
  comparables: ComparableSale[];
}

export interface OpportunityItem {
  id: number;
  title: string;
  manufacturer: string;
  model: string;
  currentBid: number;
  estimate: number;
  deviation: number;
  auctionDate: Date;
  url: string;
}

export class PriceAnalyticsService {
  /**
   * Get price trends for a specific category over time
   */
  async getPriceTrends(
    category: string,
    days: number = 30
  ): Promise<PriceTrend[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const trends = await db
      .select({
        date: sql<string>`DATE(${priceHistory.auctionDate})`,
        avgPrice: sql<number>`AVG(${priceHistory.salePrice})`,
        volume: sql<number>`COUNT(*)`
      })
      .from(priceHistory)
      .where(gte(priceHistory.auctionDate, cutoffDate))
      .groupBy(sql`DATE(${priceHistory.auctionDate})`)
      .orderBy(sql`DATE(${priceHistory.auctionDate}) ASC`);

    return trends.map(t => ({
      date: t.date,
      avgPrice: Number(t.avgPrice.toFixed(2)),
      volume: Number(t.volume)
    }));
  }

  /**
   * Find comparable sales for a specific firearm
   */
  async findComparables(
    manufacturer: string,
    model: string,
    condition?: string,
    limit: number = 10
  ): Promise<PriceAnalysis> {
    // Normalize manufacturer and model for matching
    const mfgNormalized = manufacturer.toLowerCase().trim();
    const modelNormalized = model.toLowerCase().trim();

    // Query with optional condition filter
    let query = db
      .select()
      .from(priceHistory)
      .where(
        and(
          sql`LOWER(${priceHistory.manufacturerNormalized}) = ${mfgNormalized}`,
          sql`LOWER(${priceHistory.modelNormalized}) = ${modelNormalized}`
        )
      );

    if (condition) {
      query = query.where(eq(priceHistory.condition, condition)) as any;
    }

    const comparables = await query
      .orderBy(sql`${priceHistory.auctionDate} DESC`)
      .limit(limit * 2); // Get more to calculate stats

    if (comparables.length === 0) {
      return {
        averagePrice: 0,
        medianPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceDeviation: 0,
        sampleSize: 0,
        comparables: []
      };
    }

    // Calculate statistics
    const prices = comparables.map(c => c.salePrice);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Calculate standard deviation
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const priceDeviation = (stdDev / avgPrice) * 100; // As percentage

    return {
      averagePrice: Number(avgPrice.toFixed(2)),
      medianPrice: Number(medianPrice.toFixed(2)),
      minPrice,
      maxPrice,
      priceDeviation: Number(priceDeviation.toFixed(2)),
      sampleSize: comparables.length,
      comparables: comparables.slice(0, limit).map(c => ({
        date: c.auctionDate.toISOString().split('T')[0],
        manufacturer: c.manufacturer,
        model: c.model,
        caliber: c.caliber || '',
        condition: c.condition || '',
        salePrice: c.salePrice,
        auctionHouse: c.auctionHouse || '',
        sourceUrl: c.sourceUrl || ''
      }))
    };
  }

  /**
   * Identify undervalued opportunities
   * Returns items where current bid is significantly below average
   */
  async findOpportunities(threshold: number = 20): Promise<OpportunityItem[]> {
    // Get active auctions with enrichment data
    const activeAuctions = await db
      .select()
      .from(firearmsAuctions)
      .where(
        and(
          eq(firearmsAuctions.status, 'active'),
          eq(firearmsAuctions.enrichmentStatus, 'completed')
        )
      );

    const opportunities: OpportunityItem[] = [];

    for (const auction of activeAuctions) {
      if (!auction.manufacturer || !auction.model || !auction.currentBid) {
        continue;
      }

      // Get comparables
      const analysis = await this.findComparables(
        auction.manufacturer,
        auction.model,
        auction.condition || undefined
      );

      if (analysis.sampleSize < 3) {
        // Not enough data to compare
        continue;
      }

      // Calculate deviation from average
      const deviation = ((analysis.averagePrice - auction.currentBid) / analysis.averagePrice) * 100;

      // If current bid is significantly below average, it's an opportunity
      if (deviation >= threshold) {
        opportunities.push({
          id: auction.id,
          title: `${auction.manufacturer} ${auction.model}`,
          manufacturer: auction.manufacturer,
          model: auction.model,
          currentBid: auction.currentBid,
          estimate: analysis.averagePrice,
          deviation: Number(deviation.toFixed(1)),
          auctionDate: auction.auctionDate || new Date(),
          url: auction.url
        });
      }
    }

    // Sort by deviation (highest first)
    return opportunities.sort((a, b) => b.deviation - a.deviation);
  }

  /**
   * Track auction house performance metrics
   */
  async updateCompetitorMetrics(
    auctionHouse: string,
    category: string,
    dateRange: { start: Date; end: Date }
  ): Promise<void> {
    // Get all sold items for this auction house and category in date range
    const soldItems = await db
      .select()
      .from(firearmsAuctions)
      .where(
        and(
          eq(firearmsAuctions.auctionHouse, auctionHouse),
          eq(firearmsAuctions.category, category),
          eq(firearmsAuctions.status, 'sold'),
          gte(firearmsAuctions.auctionDate, dateRange.start),
          lte(firearmsAuctions.auctionDate, dateRange.end)
        )
      );

    if (soldItems.length === 0) {
      return;
    }

    // Calculate metrics
    const salePrices = soldItems
      .filter(item => item.currentBid !== null)
      .map(item => item.currentBid as number);
    
    const avgSalePrice = salePrices.reduce((a, b) => a + b, 0) / salePrices.length;

    // Calculate realization rate (final price vs estimate)
    const withEstimates = soldItems.filter(
      item => item.estimateLow !== null && item.currentBid !== null
    );
    
    let realizationRate = 100; // Default to 100% if no estimates available
    if (withEstimates.length > 0) {
      const realizations = withEstimates.map(item => {
        const estimate = ((item.estimateLow || 0) + (item.estimateHigh || 0)) / 2;
        return estimate > 0 ? ((item.currentBid || 0) / estimate) * 100 : 100;
      });
      realizationRate = realizations.reduce((a, b) => a + b, 0) / realizations.length;
    }

    // Save or update metrics
    await db.insert(competitorMetrics).values({
      auctionHouse,
      category,
      avgSalePrice: Number(avgSalePrice.toFixed(2)),
      totalVolume: soldItems.length,
      realizationRate: Number(realizationRate.toFixed(2)),
      dateRangeStart: dateRange.start,
      dateRangeEnd: dateRange.end
    });
  }

  /**
   * Get auction house performance comparison
   */
  async getCompetitorComparison(category?: string): Promise<any[]> {
    let query = db
      .select({
        auctionHouse: competitorMetrics.auctionHouse,
        category: competitorMetrics.category,
        avgSalePrice: sql<number>`AVG(${competitorMetrics.avgSalePrice})`,
        totalVolume: sql<number>`SUM(${competitorMetrics.totalVolume})`,
        avgRealizationRate: sql<number>`AVG(${competitorMetrics.realizationRate})`
      })
      .from(competitorMetrics);

    if (category) {
      query = query.where(eq(competitorMetrics.category, category)) as any;
    }

    const results = await query
      .groupBy(competitorMetrics.auctionHouse, competitorMetrics.category)
      .orderBy(sql`SUM(${competitorMetrics.totalVolume}) DESC`);

    // Calculate market share
    const totalVolume = results.reduce((sum, r) => sum + Number(r.totalVolume), 0);

    return results.map(r => ({
      name: r.auctionHouse,
      category: r.category,
      avgSalePrice: Number(r.avgSalePrice.toFixed(2)),
      totalVolume: Number(r.totalVolume),
      marketShare: Number(((Number(r.totalVolume) / totalVolume) * 100).toFixed(2)),
      realizationRate: Number(r.avgRealizationRate.toFixed(2))
    }));
  }

  /**
   * Add a sale to price history
   */
  async recordSale(
    manufacturer: string,
    model: string,
    caliber: string,
    condition: string,
    salePrice: number,
    auctionDate: Date,
    auctionHouse: string,
    sourceUrl: string
  ): Promise<void> {
    await db.insert(priceHistory).values({
      manufacturer,
      manufacturerNormalized: manufacturer.toLowerCase().trim(),
      model,
      modelNormalized: model.toLowerCase().trim(),
      caliber,
      condition,
      salePrice,
      auctionDate,
      auctionHouse,
      sourceUrl
    });
  }
}

export const priceAnalyticsService = new PriceAnalyticsService();

