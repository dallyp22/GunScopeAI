import { firearmEnrichmentService } from './firearmEnrichment.js';
import { db } from '../db.js';
import { firearmsAuctions } from '@shared/firearms-schema';
import { eq } from 'drizzle-orm';

interface QueueItem {
  auctionId: number;
  priority: 'high' | 'normal' | 'low';
  addedAt: Date;
  retries: number;
}

interface ProcessingStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  startTime: Date;
  endTime?: Date;
  errors: { id: number; error: string }[];
}

export class EnrichmentQueue {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private maxConcurrent: number = 3;
  private maxRetries: number = 2;
  private stats: ProcessingStats | null = null;

  /**
   * Add auction to enrichment queue
   */
  add(auctionId: number, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    // Check if already in queue
    const exists = this.queue.find(item => item.auctionId === auctionId);
    if (exists) {
      console.log(`Auction ${auctionId} already in queue`);
      return;
    }

    this.queue.push({
      auctionId,
      priority,
      addedAt: new Date(),
      retries: 0
    });

    // Sort by priority
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    console.log(`✅ Added auction ${auctionId} to enrichment queue (priority: ${priority})`);
  }

  /**
   * Add multiple auctions to queue
   */
  addBatch(auctionIds: number[], priority: 'high' | 'normal' | 'low' = 'normal'): void {
    auctionIds.forEach(id => this.add(id, priority));
    console.log(`✅ Added ${auctionIds.length} auctions to enrichment queue`);
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    isProcessing: boolean;
    stats: ProcessingStats | null;
  } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      stats: this.stats
    };
  }

  /**
   * Process a single firearm auction with AI enrichment
   */
  private async processAuction(auctionId: number): Promise<void> {
    try {
      console.log(`\n📦 Processing firearms auction ${auctionId}...`);
      
      // Enrich with OpenAI
      await firearmEnrichmentService.enrichFirearmAuction(auctionId);
      
      console.log(`✅ Successfully processed firearms auction ${auctionId}`);
    } catch (error: any) {
      console.error(`❌ Failed to process firearms auction ${auctionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Process queue with concurrency control
   */
  async processQueue(): Promise<ProcessingStats> {
    if (this.isProcessing) {
      console.log('⚠️  Queue is already being processed');
      return this.stats!;
    }

    if (this.queue.length === 0) {
      console.log('✅ Queue is empty, nothing to process');
      return {
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        startTime: new Date(),
        endTime: new Date(),
        errors: []
      };
    }

    this.isProcessing = true;
    this.stats = {
      total: this.queue.length,
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: new Date(),
      errors: []
    };

    console.log(`\n🚀 Starting queue processing: ${this.stats.total} auctions`);
    console.log(`⚙️  Concurrency: ${this.maxConcurrent}, Max retries: ${this.maxRetries}`);

    while (this.queue.length > 0) {
      // Take batch for concurrent processing
      const batch = this.queue.splice(0, this.maxConcurrent);
      
      // Process batch in parallel
      const promises = batch.map(async (item) => {
        try {
          await this.processAuction(item.auctionId);
          this.stats!.successful++;
        } catch (error: any) {
          // Retry logic
          if (item.retries < this.maxRetries) {
            item.retries++;
            console.log(`   🔄 Retrying auction ${item.auctionId} (attempt ${item.retries + 1}/${this.maxRetries + 1})`);
            this.queue.push(item); // Re-add to queue
          } else {
            this.stats!.failed++;
            this.stats!.errors.push({
              id: item.auctionId,
              error: error.message || 'Unknown error'
            });
            console.error(`   ❌ Max retries reached for auction ${item.auctionId}`);
          }
        } finally {
          this.stats!.processed++;
        }
      });

      await Promise.all(promises);

      // Progress update
      const progress = ((this.stats.processed / this.stats.total) * 100).toFixed(1);
      console.log(`\n📊 Progress: ${this.stats.processed}/${this.stats.total} (${progress}%) - ✅ ${this.stats.successful} | ❌ ${this.stats.failed}`);

      // Rate limiting delay between batches (1 second)
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.stats.endTime = new Date();
    const duration = ((this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000).toFixed(1);
    
    console.log(`\n✅ Queue processing complete!`);
    console.log(`📊 Total: ${this.stats.total} | Success: ${this.stats.successful} | Failed: ${this.stats.failed}`);
    console.log(`⏱️  Duration: ${duration}s`);

    this.isProcessing = false;
    return this.stats;
  }

  /**
   * Start processing queue in background (non-blocking)
   */
  startProcessing(): void {
    if (this.isProcessing) {
      console.log('⚠️  Queue is already being processed');
      return;
    }

    // Process in background without awaiting
    this.processQueue().catch(error => {
      console.error('Queue processing error:', error);
      this.isProcessing = false;
    });
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    console.log('✅ Queue cleared');
  }

  /**
   * Get current queue items
   */
  getQueue(): QueueItem[] {
    return [...this.queue];
  }
}

// Export singleton instance
export const enrichmentQueue = new EnrichmentQueue();

/**
 * Helper function to add auction to queue
 */
export function addToQueue(auctionId: number, priority: 'high' | 'normal' | 'low' = 'normal'): void {
  enrichmentQueue.add(auctionId, priority);
}

/**
 * Helper function to enrich all pending firearms auctions
 */
export async function enrichAllPendingAuctions(): Promise<ProcessingStats> {
  console.log('\n🔍 Finding all pending firearms auctions...');
  
  const pendingAuctions = await db.query.firearmsAuctions.findMany({
    where: eq(firearmsAuctions.enrichmentStatus, 'pending')
  });

  console.log(`📊 Found ${pendingAuctions.length} pending firearms auctions`);

  if (pendingAuctions.length === 0) {
    return {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: new Date(),
      endTime: new Date(),
      errors: []
    };
  }

  // Add to queue
  const auctionIds = pendingAuctions.map(a => a.id);
  enrichmentQueue.addBatch(auctionIds, 'normal');

  // Process queue
  return await enrichmentQueue.processQueue();
}

/**
 * Helper function to re-enrich all firearms auctions
 */
export async function reEnrichAllAuctions(): Promise<ProcessingStats> {
  console.log('\n🔄 Re-enriching ALL firearms auctions...');
  
  // Get all auctions
  const allAuctions = await db.query.firearmsAuctions.findMany();
  console.log(`📊 Found ${allAuctions.length} total firearms auctions`);

  // Reset all to pending
  await db.update(firearmsAuctions).set({ 
    enrichmentStatus: 'pending'
  });

  // Add to queue
  const auctionIds = allAuctions.map(a => a.id);
  enrichmentQueue.addBatch(auctionIds, 'normal');

  // Process queue
  return await enrichmentQueue.processQueue();
}

