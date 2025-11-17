import 'dotenv/config';
import { db } from '../server/db.js';
import { firearmsAuctions } from '@shared/firearms-schema';
import { desc } from 'drizzle-orm';

/**
 * View recent firearms auctions
 * Run with: npm run firearms:recent
 */

async function main() {
  console.log('🔫 GunScope AI - Recent Firearms Auctions');
  console.log('=========================================\n');

  try {
    const recent = await db
      .select()
      .from(firearmsAuctions)
      .orderBy(desc(firearmsAuctions.scrapedAt))
      .limit(20);

    console.log(`Most recent ${recent.length} auctions:\n`);
    
    recent.forEach((auction, index) => {
      console.log(`${index + 1}. ${auction.manufacturer || 'Unknown'} ${auction.model || 'Model'}`);
      console.log(`   Caliber: ${auction.caliber || 'N/A'}`);
      console.log(`   Condition: ${auction.condition || 'N/A'}`);
      console.log(`   Current Bid: ${auction.currentBid ? '$' + auction.currentBid.toLocaleString() : 'N/A'}`);
      console.log(`   Source: ${auction.sourceWebsite}`);
      console.log(`   Enrichment: ${auction.enrichmentStatus}`);
      console.log(`   URL: ${auction.url}`);
      console.log('');
    });

    // Stats summary
    const stats = {
      total: recent.length,
      enriched: recent.filter(a => a.enrichmentStatus === 'completed').length,
      pending: recent.filter(a => a.enrichmentStatus === 'pending').length,
      withBids: recent.filter(a => a.currentBid !== null).length
    };

    console.log(`📊 Statistics:`);
    console.log(`   Total shown: ${stats.total}`);
    console.log(`   Enriched: ${stats.enriched}`);
    console.log(`   Pending enrichment: ${stats.pending}`);
    console.log(`   With current bids: ${stats.withBids}`);

  } catch (error) {
    console.error('❌ Failed to fetch recent auctions:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();

