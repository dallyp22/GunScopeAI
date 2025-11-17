import 'dotenv/config';
import { firearmScraperService } from '../server/services/firearmScraper.js';

/**
 * Scrape all firearms auction sources
 * Run with: npm run firearms:scrape
 */

async function main() {
  console.log('🔫 GunScope AI - Firearms Auction Scraper');
  console.log('==========================================\n');

  try {
    console.log('Starting comprehensive scrape of all 35 auction sources...\n');
    
    const auctions = await firearmScraperService.scrapeAllSources();
    
    console.log('\n✅ Scraping complete!');
    console.log(`📊 Total auctions discovered: ${auctions.length}`);
    
    const stats = firearmScraperService.getLastScrapeStats();
    const totalDiscovered = stats.reduce((sum, s) => sum + s.discoveredUrls, 0);
    const totalSaved = stats.reduce((sum, s) => sum + s.successfulSaves, 0);
    const totalFailed = stats.reduce((sum, s) => sum + s.failedScrapes + s.failedSaves, 0);
    
    console.log(`\n📈 Summary:`);
    console.log(`   Discovered: ${totalDiscovered}`);
    console.log(`   Saved: ${totalSaved}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${((totalSaved / totalDiscovered) * 100).toFixed(1)}%`);
    
    console.log('\n💡 Next step: Run "npm run firearms:enrich" to enrich with AI');
    
  } catch (error) {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();

