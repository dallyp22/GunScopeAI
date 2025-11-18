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
   * Extract firearms from an auction site using map + extract strategy
   * More reliable than wildcard extraction
   */
  async extractFromAuctionSite(source: any) {
    console.log(`🔍 Firecrawl Extract: ${source.name}`);
    
    try {
      // STEP 1: Use map() to discover auction pages
      console.log(`  📍 Step 1: Discovering pages with map()`);
      const mapResponse = await firecrawlService.map(source.url, 'firearms guns auction');
      
      if (!mapResponse || !mapResponse.links) {
        console.log(`  ❌ No links discovered from ${source.name}`);
        return { firearms: [] };
      }

      // Extract URLs from link objects
      const allUrls = mapResponse.links
        .map((link: any) => typeof link === 'string' ? link : link.url)
        .filter((url: string) => url && url.startsWith('http'));
      
      console.log(`  📊 Discovered ${allUrls.length} total URLs`);
      
      // Filter for auction/firearms pages
      const auctionUrls = allUrls.filter((url: string) => 
        url.includes('auction') || 
        url.includes('firearms') || 
        url.includes('gun') ||
        url.includes('item') ||
        url.includes('lot')
      ).slice(0, 20); // Limit to 20 pages
      
      console.log(`  🎯 Filtered to ${auctionUrls.length} potential auction pages`);
      
      if (auctionUrls.length === 0) {
        console.log(`  ⚠️  No auction pages found for ${source.name}`);
        return { firearms: [] };
      }

      // STEP 2: Extract firearms from discovered pages (in batches to respect rate limits)
      console.log(`  🔄 Step 2: Extracting firearms from ${auctionUrls.length} pages`);
      
      // Process in smaller batches to avoid hitting Firecrawl concurrency limits
      const batchSize = 5;
      const allFirearms: any[] = [];
      
      for (let i = 0; i < auctionUrls.length; i += batchSize) {
        const batch = auctionUrls.slice(i, i + batchSize);
        console.log(`    Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} URLs)...`);
        
        try {
          const result = await firecrawlService.extract({
            urls: batch,
            prompt: extractionPrompt,
            schema: firearmExtractionSchema,
            allowExternalLinks: false
          });
          
          if (result.data?.firearms) {
            allFirearms.push(...result.data.firearms);
          }
          
          // Small delay between batches
          if (i + batchSize < auctionUrls.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`    ❌ Batch extraction failed:`, error);
        }
      }
      
      const firearmsFound = allFirearms.length;
      console.log(`  ✅ Extracted ${firearmsFound} firearms from ${source.name}`);
      
      const result = { data: { firearms: allFirearms } };
      
      // Save to cache
      if (firearmsFound > 0) {
        const discoveredUrls = result.data.firearms
          .map((f: any) => f.auctionUrl)
          .filter((url: string) => url);
        
        await scrapingCacheService.saveSiteMap(
          source.url,
          source.name,
          auctionUrls, // Save all auction URLs we found
          firearmsFound
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

