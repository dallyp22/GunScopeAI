import 'dotenv/config';
import { db } from '../server/db.js';
import { priceHistory, competitorMetrics, firearmsAuctions } from '@shared/firearms-schema';

/**
 * Add mock data to populate all dashboard components
 */

async function addDashboardMockData() {
  console.log('📊 Adding mock data for Dashboard components...\n');

  try {
    // 1. Add Price History (for PriceCharts)
    console.log('1. Adding price history data...');
    
    const priceData = [];
    const manufacturers = ['Colt', 'Smith & Wesson', 'Winchester', 'Remington', 'Glock'];
    const models = ['Python', 'Model 29', 'Model 70', '870', '19'];
    
    // Generate 30 days of price history
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      
      for (let j = 0; j < 3; j++) {
        const mfg = manufacturers[Math.floor(Math.random() * manufacturers.length)];
        const model = models[Math.floor(Math.random() * models.length)];
        
        priceData.push({
          manufacturer: mfg,
          manufacturerNormalized: mfg.toLowerCase(),
          model: model,
          modelNormalized: model.toLowerCase(),
          caliber: '.357 Magnum',
          condition: 'Excellent',
          salePrice: 1500 + Math.random() * 2000,
          auctionDate: date,
          auctionHouse: 'GunBroker.com',
          sourceUrl: 'https://www.gunbroker.com'
        });
      }
    }
    
    await db.insert(priceHistory).values(priceData);
    console.log(`   ✅ Added ${priceData.length} price history records`);

    // 2. Add Competitor Metrics (for CompetitorIntel)
    console.log('2. Adding competitor metrics...');
    
    const competitorData = [
      {
        auctionHouse: 'GunBroker.com',
        category: 'Handgun',
        avgSalePrice: 850,
        totalVolume: 1250,
        realizationRate: 98.5,
        dateRangeStart: new Date('2025-10-01'),
        dateRangeEnd: new Date('2025-11-17')
      },
      {
        auctionHouse: 'Morphy Auctions',
        category: 'Rifle',
        avgSalePrice: 2400,
        totalVolume: 320,
        realizationRate: 112.3,
        dateRangeStart: new Date('2025-10-01'),
        dateRangeEnd: new Date('2025-11-17')
      },
      {
        auctionHouse: 'GunsAmerica.com',
        category: 'Handgun',
        avgSalePrice: 680,
        totalVolume: 890,
        realizationRate: 95.2,
        dateRangeStart: new Date('2025-10-01'),
        dateRangeEnd: new Date('2025-11-17')
      },
      {
        auctionHouse: 'Rock Island Auction',
        category: 'Military',
        avgSalePrice: 1850,
        totalVolume: 450,
        realizationRate: 105.7,
        dateRangeStart: new Date('2025-10-01'),
        dateRangeEnd: new Date('2025-11-17')
      },
      {
        auctionHouse: 'Summit Gun Auctions',
        category: 'Rifle',
        avgSalePrice: 920,
        totalVolume: 210,
        realizationRate: 88.4,
        dateRangeStart: new Date('2025-10-01'),
        dateRangeEnd: new Date('2025-11-17')
      }
    ];
    
    await db.insert(competitorMetrics).values(competitorData);
    console.log(`   ✅ Added ${competitorData.length} competitor metric records`);

    // 3. Add More Auctions (for LiveAuctionFeed with ending soon dates)
    console.log('3. Adding more auction listings...');
    
    const moreAuctions = [
      {
        title: "Beretta 92FS 9mm",
        url: "https://www.gunbroker.com/item/1004",
        sourceWebsite: "GunBroker.com",
        manufacturer: "Beretta",
        model: "92FS",
        caliber: "9mm",
        category: "Handgun",
        condition: "Excellent",
        currentBid: 620,
        estimateLow: 550,
        estimateHigh: 750,
        auctionHouse: "GunBroker.com",
        state: "TX",
        city: "Austin",
        latitude: 30.2672,
        longitude: -97.7431,
        auctionDate: new Date('2025-11-19'), // 2 days away
        enrichmentStatus: 'completed'
      },
      {
        title: "Springfield 1911 .45 ACP",
        url: "https://gunsamerica.com/item/3002",
        sourceWebsite: "GunsAmerica.com",
        manufacturer: "Springfield",
        model: "1911",
        caliber: ".45 ACP",
        category: "Handgun",
        condition: "Very Good",
        currentBid: 890,
        estimateLow: 800,
        estimateHigh: 1100,
        auctionHouse: "GunsAmerica.com",
        state: "OK",
        city: "Tulsa",
        latitude: 36.1540,
        longitude: -95.9928,
        auctionDate: new Date('2025-11-18'), // Tomorrow
        enrichmentStatus: 'completed'
      },
      {
        title: "Ruger 10/22 .22 LR",
        url: "https://gunspot.com/item/5001",
        sourceWebsite: "GunSpot.com",
        manufacturer: "Ruger",
        model: "10/22",
        caliber: ".22 LR",
        category: "Rifle",
        condition: "NIB",
        currentBid: 320,
        estimateLow: 300,
        estimateHigh: 400,
        auctionHouse: "GunSpot.com",
        state: "LA",
        city: "Baton Rouge",
        latitude: 30.4515,
        longitude: -91.1871,
        auctionDate: new Date('2025-11-20'),
        enrichmentStatus: 'completed'
      },
      {
        title: "Sig Sauer P320 9mm",
        url: "https://www.gunauction.com/item/2002",
        sourceWebsite: "GunAuction.com",
        manufacturer: "Sig Sauer",
        model: "P320",
        caliber: "9mm",
        category: "Handgun",
        condition: "Excellent",
        currentBid: 480,
        estimateLow: 450,
        estimateHigh: 600,
        auctionHouse: "GunAuction.com",
        state: "TX",
        city: "Fort Worth",
        latitude: 32.7555,
        longitude: -97.3308,
        auctionDate: new Date('2025-11-21'),
        enrichmentStatus: 'completed'
      },
      {
        title: "AR-15 5.56 NATO Complete",
        url: "https://firearmland.com/item/6001",
        sourceWebsite: "FirearmLand",
        manufacturer: "Anderson",
        model: "AM-15",
        caliber: "5.56 NATO",
        category: "Rifle",
        condition: "Good",
        currentBid: 650,
        estimateLow: 600,
        estimateHigh: 850,
        auctionHouse: "FirearmLand",
        state: "TX",
        city: "Waco",
        latitude: 31.5493,
        longitude: -97.1467,
        auctionDate: new Date('2025-11-23'),
        enrichmentStatus: 'completed'
      },
      {
        title: "Mossberg 500 12 Gauge",
        url: "https://www.sslfirearms.com/item/7001",
        sourceWebsite: "SSL Firearms",
        manufacturer: "Mossberg",
        model: "500",
        caliber: "12 Gauge",
        category: "Shotgun",
        condition: "Very Good",
        currentBid: 380,
        estimateLow: 350,
        estimateHigh: 500,
        auctionHouse: "SSL Firearms",
        state: "OK",
        city: "Enid",
        latitude: 36.3956,
        longitude: -97.8784,
        auctionDate: new Date('2025-11-24'),
        enrichmentStatus: 'completed'
      }
    ];
    
    await db.insert(firearmsAuctions).values(moreAuctions);
    console.log(`   ✅ Added ${moreAuctions.length} more auction listings`);

    console.log('\n✨ Dashboard mock data complete!');
    console.log('\n📊 Summary:');
    console.log(`   Price History: ${priceData.length} records (30 days)`);
    console.log(`   Competitor Metrics: ${competitorData.length} auction houses`);
    console.log(`   Total Auctions: ${6 + moreAuctions.length} (6 original + ${moreAuctions.length} new)`);
    
    console.log('\n🎯 Dashboard components will now show:');
    console.log('   ✅ Price Charts - 30 days of trend data');
    console.log('   ✅ Competitor Intel - 5 auction houses with metrics');
    console.log('   ✅ Live Feed - 13 total auctions');
    console.log('   ✅ Ending Soon - Several auctions in next 7 days');
    console.log('   ✅ Map - 13 markers across TX, OK, LA, KS');
    
    console.log('\n🔄 Refresh your browser to see all components populated!');

  } catch (error) {
    console.error('❌ Failed to add mock data:', error);
    process.exit(1);
  }

  process.exit(0);
}

addDashboardMockData();

