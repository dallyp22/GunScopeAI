import 'dotenv/config';
import { db } from '../server/db.js';
import { firearmsAuctions } from '@shared/firearms-schema';

/**
 * Add sample firearms auctions for testing and demo purposes
 */

const sampleAuctions = [
  {
    title: "Colt Python .357 Magnum",
    url: "https://www.gunbroker.com/item/1001",
    sourceWebsite: "GunBroker.com",
    description: "Excellent condition Colt Python 6-inch barrel, bright bore, 95% finish",
    manufacturer: "Colt",
    model: "Python",
    caliber: ".357 Magnum",
    category: "Handgun",
    subCategory: "Revolver",
    condition: "Excellent",
    currentBid: 2800,
    estimateLow: 2500,
    estimateHigh: 3500,
    auctionHouse: "GunBroker.com",
    lotNumber: "1001",
    state: "TX",
    city: "Dallas",
    latitude: 32.7767,
    longitude: -96.7970,
    auctionDate: new Date('2025-12-01'),
    enrichmentStatus: 'completed'
  },
  {
    title: "Smith & Wesson Model 29 .44 Magnum",
    url: "https://www.gunbroker.com/item/1002",
    sourceWebsite: "GunBroker.com",
    description: "Classic S&W Model 29, 6.5-inch barrel, good condition",
    manufacturer: "Smith & Wesson",
    model: "Model 29",
    caliber: ".44 Magnum",
    category: "Handgun",
    subCategory: "Revolver",
    condition: "Good",
    currentBid: 1200,
    estimateLow: 1000,
    estimateHigh: 1500,
    auctionHouse: "GunBroker.com",
    lotNumber: "1002",
    state: "OK",
    city: "Oklahoma City",
    latitude: 35.4676,
    longitude: -97.5164,
    auctionDate: new Date('2025-11-25'),
    enrichmentStatus: 'completed'
  },
  {
    title: "Winchester Model 70 .30-06",
    url: "https://morphyauctions.com/item/2001",
    sourceWebsite: "Morphy Auctions",
    description: "Pre-64 Winchester Model 70 in .30-06, excellent bore, collector grade",
    manufacturer: "Winchester",
    model: "Model 70",
    caliber: ".30-06",
    category: "Rifle",
    subCategory: "Bolt-Action",
    condition: "Very Good",
    currentBid: 1800,
    estimateLow: 1500,
    estimateHigh: 2500,
    auctionHouse: "Morphy Auctions",
    lotNumber: "2001",
    state: "LA",
    city: "New Orleans",
    latitude: 29.9511,
    longitude: -90.0715,
    auctionDate: new Date('2025-11-28'),
    enrichmentStatus: 'completed',
    rarity: "Scarce",
    investmentGrade: true
  },
  {
    title: "Remington 870 12 Gauge",
    url: "https://gunsamerica.com/item/3001",
    sourceWebsite: "GunsAmerica.com",
    description: "Remington 870 Wingmaster, 28-inch barrel, excellent condition",
    manufacturer: "Remington",
    model: "870 Wingmaster",
    caliber: "12 Gauge",
    category: "Shotgun",
    subCategory: "Pump-Action",
    condition: "Excellent",
    currentBid: 450,
    estimateLow: 400,
    estimateHigh: 600,
    auctionHouse: "GunsAmerica.com",
    lotNumber: "3001",
    state: "TX",
    city: "Houston",
    latitude: 29.7604,
    longitude: -95.3698,
    auctionDate: new Date('2025-12-05'),
    enrichmentStatus: 'completed'
  },
  {
    title: "M1 Garand .30-06 CMP",
    url: "https://thecmp.org/item/4001",
    sourceWebsite: "Civilian Marksmanship Program (CMP)",
    description: "WWII M1 Garand, Service Grade, good bore, matching numbers",
    manufacturer: "Springfield Armory",
    model: "M1 Garand",
    caliber: ".30-06",
    category: "Military",
    subCategory: "Semi-Auto",
    condition: "Good",
    currentBid: 1100,
    estimateLow: 1000,
    estimateHigh: 1300,
    auctionHouse: "CMP",
    lotNumber: "4001",
    state: "National",
    city: "Online",
    latitude: 39.8283,
    longitude: -98.5795,
    auctionDate: new Date('2025-11-30'),
    enrichmentStatus: 'completed',
    provenance: "WWII bring-back",
    rarity: "Common",
    investmentGrade: false
  },
  {
    title: "Glock 19 Gen 5 9mm",
    url: "https://www.gunbroker.com/item/1003",
    sourceWebsite: "GunBroker.com",
    description: "NIB Glock 19 Gen 5, never fired, includes 3 magazines",
    manufacturer: "Glock",
    model: "19 Gen 5",
    caliber: "9mm",
    category: "Handgun",
    subCategory: "Semi-Auto",
    condition: "NIB",
    currentBid: 550,
    estimateLow: 500,
    estimateHigh: 650,
    auctionHouse: "GunBroker.com",
    lotNumber: "1003",
    state: "TX",
    city: "San Antonio",
    latitude: 29.4241,
    longitude: -98.4936,
    auctionDate: new Date('2025-11-22'),
    enrichmentStatus: 'completed'
  }
];

async function addSampleData() {
  console.log('🔫 Adding sample firearms auction data...\n');

  try {
    for (const auction of sampleAuctions) {
      const inserted = await db.insert(firearmsAuctions).values(auction).returning();
      console.log(`✅ Added: ${auction.manufacturer} ${auction.model}`);
    }

    console.log(`\n✨ Successfully added ${sampleAuctions.length} sample auctions!`);
    console.log('\n📍 Sample auctions have coordinates for map testing:');
    console.log('   - Dallas, TX');
    console.log('   - Oklahoma City, OK');
    console.log('   - New Orleans, LA');
    console.log('   - Houston, TX');
    console.log('   - San Antonio, TX');
    console.log('   - Kansas (center of US)');
    
    console.log('\n🗺️  Refresh your Map view to see markers!');
    console.log('📋 Refresh your List view to see the table!');

  } catch (error) {
    console.error('❌ Failed to add sample data:', error);
    process.exit(1);
  }

  process.exit(0);
}

addSampleData();

