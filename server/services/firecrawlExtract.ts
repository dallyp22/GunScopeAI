import { firecrawlService } from './firecrawl.js';
import { scrapingCacheService } from './scrapingCache.js';

// Firearms extraction schema for Firecrawl
const firearmExtractionSchema = {
  type: 'object',
  properties: {
    firearms: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          manufacturer: { type: 'string' },
          model: { type: 'string' },
          caliber: { type: 'string' },
          category: { 
            type: 'string', 
            enum: ['Handgun', 'Rifle', 'Shotgun', 'Machine Gun', 'Antique', 'Military'] 
          },
          condition: { type: 'string' },
          currentBid: { type: 'number' },
          estimateLow: { type: 'number' },
          estimateHigh: { type: 'number' },
          lotNumber: { type: 'string' },
          auctionDate: { type: 'string' },
          auctionHouse: { type: 'string' },
          auctionUrl: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['title']
      }
    }
  },
  required: ['firearms']
};

const extractionPrompt = `Extract all firearms auction listings from this auction house website.

For each firearm auction you find, extract:
- Title and full description
- Manufacturer and model
- Caliber/gauge
- Category (Handgun, Rifle, Shotgun, Machine Gun, Antique, or Military)
- Condition grade
- Current bid amount (if available)
- Estimate range (low and high)
- Lot number
- Auction date
- Auction house name
- Direct URL to the auction listing

Only include actual firearms auctions, not accessories or non-firearm items.
Return empty array if no firearms found.`;

export class FirecrawlExtractService {
  /**
   * Extract firearms from an auction site using Firecrawl's extract endpoint
   */
  async extractFromAuctionSite(source: any) {
    console.log(`🔍 Firecrawl Extract: ${source.name}`);
    
    try {
      // Check cache first
      const cachedMap = await scrapingCacheService.getSiteMap(source.url);
      
      if (cachedMap && new Date(cachedMap.expiresAt) > new Date()) {
        console.log(`  📦 Cache valid for ${source.name} (expires in ${Math.round((new Date(cachedMap.expiresAt).getTime() - Date.now()) / 1000 / 60)} min)`);
        
        // Use map to find current URLs
        const mapResponse = await firecrawlService.map(source.url, 'firearms auction');
        const currentUrls = mapResponse?.links?.map((l: any) => l.url) || [];
        
        // Get only new URLs
        const newUrls = await scrapingCacheService.getNewUrls(source.url, currentUrls);
        
        if (newUrls.length === 0) {
          console.log(`  ✅ No new pages for ${source.name} - skipping`);
          return { firearms: [] };
        }
        
        console.log(`  🔄 Found ${newUrls.length} new pages to extract`);
        // Extract only from new pages
        return await this.extractFromUrls(newUrls, source);
      }
      
      // Full extraction with wildcard
      const extractUrl = source.extractUrl || `${source.url}/*`;
      console.log(`  🌐 Full extraction from ${extractUrl}`);
      
      const result = await firecrawlService.extract({
        urls: [extractUrl],
        prompt: extractionPrompt,
        schema: firearmExtractionSchema,
        allowExternalLinks: false,
        includeSubdomains: false
      });
      
      console.log(`  ✅ Extracted ${result.data?.firearms?.length || 0} firearms`);
      
      // Save to cache
      if (result.data?.firearms) {
        const discoveredUrls = result.data.firearms
          .map((f: any) => f.auctionUrl)
          .filter((url: string) => url);
        
        await scrapingCacheService.saveSiteMap(
          source.url,
          source.name,
          discoveredUrls,
          result.data.firearms.length
        );
      }
      
      return result.data || { firearms: [] };
      
    } catch (error) {
      console.error(`❌ Extraction failed for ${source.name}:`, error);
      return { firearms: [] };
    }
  }

  /**
   * Extract from specific URLs (for cache-based incremental extraction)
   */
  private async extractFromUrls(urls: string[], source: any) {
    if (urls.length === 0) return { firearms: [] };
    
    console.log(`  📄 Extracting from ${urls.length} specific URLs`);
    
    try {
      const result = await firecrawlService.extract({
        urls: urls.slice(0, 20), // Limit to 20 URLs per batch
        prompt: extractionPrompt,
        schema: firearmExtractionSchema
      });
      
      return result.data || { firearms: [] };
    } catch (error) {
      console.error(`  ❌ URL extraction failed:`, error);
      return { firearms: [] };
    }
  }

  /**
   * Extract with job polling for large sites
   */
  async extractWithPolling(source: any) {
    console.log(`🔄 Starting extract job for ${source.name}`);
    
    try {
      // Start extraction job (returns ID immediately)
      const startResult = await firecrawlService.extract({
        urls: [`${source.url}/*`],
        prompt: extractionPrompt,
        schema: firearmExtractionSchema
      });

      // If it returns data immediately, return it
      if (startResult.data) {
        return startResult.data;
      }

      // Otherwise would need to poll (not implemented in current Firecrawl service)
      return { firearms: [] };
      
    } catch (error) {
      console.error(`❌ Polling extraction failed:`, error);
      return { firearms: [] };
    }
  }
}

export const firecrawlExtractService = new FirecrawlExtractService();

