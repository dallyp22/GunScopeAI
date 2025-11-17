import 'dotenv/config';
import { db } from '../server/db.js';
import { firearmsAuctions } from '@shared/firearms-schema';
import { firearmEnrichmentService } from '../server/services/firearmEnrichment.js';
import { eq } from 'drizzle-orm';

/**
 * Enrich all pending firearms auctions with AI
 * Run with: npm run firearms:enrich
 * Force re-enrichment: npm run firearms:enrich:force
 */

async function main() {
  console.log('🤖 GunScope AI - Firearms Enrichment');
  console.log('====================================\n');

  const force = process.argv.includes('--force');

  try {
    // Get auctions needing enrichment
    const query = force
      ? db.select().from(firearmsAuctions)
      : db.select().from(firearmsAuctions).where(eq(firearmsAuctions.enrichmentStatus, 'pending'));

    const auctions = await query;

    console.log(`Found ${auctions.length} auctions to enrich${force ? ' (force mode)' : ''}\n`);

    if (auctions.length === 0) {
      console.log('No auctions need enrichment.');
      process.exit(0);
    }

    // Enrich in batches
    const auctionIds = auctions.map(a => a.id);
    const batchSize = 5;
    
    console.log(`Processing in batches of ${batchSize}...\n`);
    
    let processed = 0;
    for (let i = 0; i < auctionIds.length; i += batchSize) {
      const batch = auctionIds.slice(i, i + batchSize);
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Enriching ${batch.length} auctions...`);
      
      const result = await firearmEnrichmentService.enrichBatch(batch, batchSize);
      processed += result.successful;
      
      console.log(`  ✅ Success: ${result.successful}, ❌ Failed: ${result.failed}`);
      
      if (result.errors.length > 0) {
        console.log(`  Errors:`);
        result.errors.forEach(err => {
          console.log(`    - Auction ${err.id}: ${err.error}`);
        });
      }
      
      // Small delay between batches
      if (i + batchSize < auctionIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n✅ Enrichment complete!`);
    console.log(`📊 Total processed: ${processed}/${auctions.length}`);
    
    // Get final stats
    const stats = await firearmEnrichmentService.getEnrichmentStats();
    console.log(`\n📈 Enrichment Status:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Success Rate: ${((stats.completed / stats.total) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('\n❌ Enrichment failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();

