import 'dotenv/config';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function verifyDatabase() {
  try {
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    console.log('📊 Database Tables Created:\n');
    tables.rows.forEach((row: any, i: number) => {
      console.log(`   ${i + 1}. ${row.tablename}`);
    });
    console.log('\n✅ Database verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }
}

verifyDatabase();

