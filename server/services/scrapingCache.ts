import { db } from '../db.js';
import { scrapingCache } from '@shared/firearms-schema';
import { eq, gte, and } from 'drizzle-orm';

export class ScrapingCacheService {
  /**
   * Get cached site map if still valid
   */
  async getSiteMap(sourceUrl: string) {
    try {
      const cached = await db.select()
        .from(scrapingCache)
        .where(
          and(
            eq(scrapingCache.sourceUrl, sourceUrl),
            gte(scrapingCache.expiresAt, new Date())
          )
        )
        .limit(1);
      
      return cached[0] || null;
    } catch (error) {
      console.warn('Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Save site map to cache (24 hour TTL)
   */
  async saveSiteMap(
    sourceUrl: string, 
    sourceName: string, 
    discoveredUrls: string[], 
    firearmsFound: number
  ) {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      // Check if exists
      const existing = await db.select()
        .from(scrapingCache)
        .where(eq(scrapingCache.sourceUrl, sourceUrl))
        .limit(1);

      if (existing.length > 0) {
        // Update
        await db.update(scrapingCache)
          .set({
            discoveredUrls,
            lastScraped: now,
            expiresAt,
            auctionCount: discoveredUrls.length,
            firearmsFound
          })
          .where(eq(scrapingCache.sourceUrl, sourceUrl));
      } else {
        // Insert
        await db.insert(scrapingCache).values({
          sourceUrl,
          sourceName,
          discoveredUrls,
          lastScraped: now,
          expiresAt,
          auctionCount: discoveredUrls.length,
          firearmsFound
        });
      }

      console.log(`  💾 Cached ${discoveredUrls.length} URLs for ${sourceName}`);
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  /**
   * Get only URLs that aren't in cache (new pages)
   */
  async getNewUrls(sourceUrl: string, currentUrls: string[]): Promise<string[]> {
    try {
      const cached = await this.getSiteMap(sourceUrl);
      
      if (!cached || !cached.discoveredUrls) {
        return currentUrls;
      }

      const cachedSet = new Set(cached.discoveredUrls as string[]);
      const newUrls = currentUrls.filter(url => !cachedSet.has(url));
      
      console.log(`  📊 Cache: ${cached.discoveredUrls.length} known, ${newUrls.length} new`);
      
      return newUrls;
    } catch (error) {
      console.warn('Failed to check new URLs:', error);
      return currentUrls; // Return all if cache check fails
    }
  }

  /**
   * Check if cache is still valid
   */
  async isValid(sourceUrl: string): Promise<boolean> {
    const cached = await this.getSiteMap(sourceUrl);
    return cached !== null;
  }

  /**
   * Invalidate cache for a source (force refresh)
   */
  async invalidate(sourceUrl: string) {
    try {
      await db.update(scrapingCache)
        .set({ expiresAt: new Date(0) }) // Set to past date
        .where(eq(scrapingCache.sourceUrl, sourceUrl));
      
      console.log(`🗑️ Invalidated cache for ${sourceUrl}`);
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }

  /**
   * Get all cache statistics
   */
  async getStats() {
    try {
      const stats = await db.select().from(scrapingCache);
      
      const now = new Date();
      const valid = stats.filter(s => new Date(s.expiresAt) > now);
      const expired = stats.filter(s => new Date(s.expiresAt) <= now);
      
      return {
        total: stats.length,
        valid: valid.length,
        expired: expired.length,
        totalUrls: stats.reduce((sum, s) => sum + (s.auctionCount || 0), 0),
        totalFirearms: stats.reduce((sum, s) => sum + (s.firearmsFound || 0), 0),
        sources: stats
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {
        total: 0,
        valid: 0,
        expired: 0,
        totalUrls: 0,
        totalFirearms: 0,
        sources: []
      };
    }
  }
}

export const scrapingCacheService = new ScrapingCacheService();

