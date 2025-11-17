import 'dotenv/config';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

/**
 * Setup script for GunScope AI database
 * Creates all necessary tables and indexes
 */

async function setupDatabase() {
  console.log('🔧 Setting up GunScope AI database...\n');

  try {
    // Test connection
    console.log('1. Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('   ✅ Database connected\n');

    // Note: Tables will be created via drizzle-kit push
    // This script is for additional setup and verification

    console.log('2. Verifying schema...');
    console.log('   Run: npm run db:push');
    console.log('   This will create all tables from shared/schema.ts and firearms-schema.ts\n');

    console.log('3. Creating indexes...');
    // Additional indexes beyond what's in schema
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS firearms_manufacturer_model_idx 
      ON firearms_auctions(manufacturer, model);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS firearms_price_idx 
      ON firearms_auctions(current_bid) WHERE current_bid IS NOT NULL;
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS price_history_search_idx 
      ON price_history(manufacturer_normalized, model_normalized, condition);
    `);
    console.log('   ✅ Additional indexes created\n');

    console.log('4. Creating full-text search index...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS firearms_search_idx 
      ON firearms_auctions 
      USING GIN (to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(manufacturer, '') || ' ' || 
        COALESCE(model, '')
      ));
    `);
    console.log('   ✅ Full-text search enabled\n');

    console.log('✨ Database setup complete!\n');
    console.log('Next steps:');
    console.log('1. Run: npm run firearms:scrape (to scrape auction sources)');
    console.log('2. Run: npm run firearms:enrich (to enrich with AI)');
    console.log('3. Run: npm run dev (to start the application)\n');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

setupDatabase();

