import { pgTable, text, serial, integer, real, timestamp, json, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

/**
 * Firearms Auctions - Main table for firearms auction listings
 */
export const firearmsAuctions = pgTable("firearms_auctions", {
  id: serial("id").primaryKey(),
  
  // Core auction info
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  sourceWebsite: text("source_website").notNull(),
  description: text("description"),
  
  // Firearm identification
  manufacturer: text("manufacturer"),
  model: text("model"),
  caliber: text("caliber"),
  serialNumber: text("serial_number"),
  yearManufactured: integer("year_manufactured"),
  
  // Condition
  condition: text("condition"), // NIB, Excellent, Very Good, Good, Fair, Poor
  boreCondition: text("bore_condition"),
  finishPercentage: integer("finish_percentage"),
  originalParts: boolean("original_parts"),
  mechanicalFunction: text("mechanical_function"),
  
  // Categories
  category: text("category"), // Handgun, Rifle, Shotgun, Machine Gun, Antique, Military
  subCategory: text("sub_category"), // Revolver, Semi-Auto, Bolt-Action, etc.
  
  // Auction details
  auctionHouse: text("auction_house"),
  auctionDate: timestamp("auction_date"),
  lotNumber: text("lot_number"),
  startingBid: real("starting_bid"),
  currentBid: real("current_bid"),
  estimateLow: real("estimate_low"),
  estimateHigh: real("estimate_high"),
  reserveMet: boolean("reserve_met"),
  
  // Location
  latitude: real("latitude"),
  longitude: real("longitude"),
  city: text("city"),
  state: text("state"),
  
  // Legal/Transfer
  transferType: text("transfer_type"), // Standard, C&R, NFA, Antique
  nfaItem: boolean("nfa_item").default(false),
  nfaRegistration: text("nfa_registration"),
  
  // Value intelligence
  provenance: text("provenance"),
  rarity: text("rarity"), // Common, Scarce, Rare, Extremely Rare
  desirability: integer("desirability"), // 1-10 scale
  investmentGrade: boolean("investment_grade"),
  
  // Estate sale flags
  isEstateSale: boolean("is_estate_sale").default(false),
  estateSize: text("estate_size"), // Small, Medium, Large, Collection
  collectionName: text("collection_name"),
  
  // Accessories & extras
  includedAccessories: json("included_accessories"),
  originalBox: boolean("original_box"),
  paperwork: boolean("paperwork"),
  
  // Market data
  recentSales: json("recent_sales"), // Array of {date, price, venue}
  priceDeviation: real("price_deviation"), // % vs market average
  competitorMetrics: json("competitor_metrics"),
  
  // AI enrichment
  enrichmentStatus: text("enrichment_status").default("pending"),
  enrichedAt: timestamp("enriched_at"),
  enrichmentVersion: text("enrichment_version").default("v1"),
  aiExtractedData: json("ai_extracted_data"),
  
  // Images
  images: json("images"), // Array of URLs
  primaryImage: text("primary_image"),
  
  // Metadata
  status: text("status").default("active"), // active, sold, cancelled
  scrapedAt: timestamp("scraped_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  urlIdx: index("firearms_url_idx").on(table.url),
  manufacturerIdx: index("firearms_manufacturer_idx").on(table.manufacturer),
  categoryIdx: index("firearms_category_idx").on(table.category),
  auctionDateIdx: index("firearms_auction_date_idx").on(table.auctionDate),
  statusIdx: index("firearms_status_idx").on(table.status),
  enrichmentIdx: index("firearms_enrichment_idx").on(table.enrichmentStatus),
}));

/**
 * Price History - Historical sales data for market analysis
 */
export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(),
  manufacturerNormalized: text("manufacturer_normalized"),
  model: text("model").notNull(),
  modelNormalized: text("model_normalized"),
  caliber: text("caliber"),
  condition: text("condition"),
  salePrice: real("sale_price").notNull(),
  auctionDate: timestamp("auction_date").notNull(),
  auctionHouse: text("auction_house"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  manufacturerModelIdx: index("price_history_mfg_model_idx").on(table.manufacturerNormalized, table.modelNormalized),
  auctionDateIdx: index("price_history_date_idx").on(table.auctionDate),
}));

/**
 * Competitor Metrics - Auction house performance tracking
 */
export const competitorMetrics = pgTable("competitor_metrics", {
  id: serial("id").primaryKey(),
  auctionHouse: text("auction_house").notNull(),
  category: text("category"),
  avgSalePrice: real("avg_sale_price"),
  totalVolume: integer("total_volume"),
  realizationRate: real("realization_rate"), // final/estimate %
  dateRangeStart: timestamp("date_range_start"),
  dateRangeEnd: timestamp("date_range_end"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  auctionHouseIdx: index("competitor_metrics_house_idx").on(table.auctionHouse),
  categoryIdx: index("competitor_metrics_category_idx").on(table.category),
}));

/**
 * User Alerts - User-defined alert criteria for matching auctions
 */
export const userAlerts = pgTable("user_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  alertType: text("alert_type").notNull(), // manufacturer, model, category, price_drop, estate_sale
  criteria: json("criteria").notNull(),
  active: boolean("active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_alerts_user_idx").on(table.userId),
  activeIdx: index("user_alerts_active_idx").on(table.active),
}));

// Type exports
export type FirearmAuction = typeof firearmsAuctions.$inferSelect;
export type InsertFirearmAuction = typeof firearmsAuctions.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;
export type CompetitorMetrics = typeof competitorMetrics.$inferSelect;
export type InsertCompetitorMetrics = typeof competitorMetrics.$inferInsert;
export type UserAlert = typeof userAlerts.$inferSelect;
export type InsertUserAlert = typeof userAlerts.$inferInsert;

// Zod validation schemas
export const insertFirearmAuctionSchema = createInsertSchema(firearmsAuctions).omit({
  id: true,
  scrapedAt: true,
  updatedAt: true,
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
  createdAt: true,
});

export const insertUserAlertSchema = createInsertSchema(userAlerts).omit({
  id: true,
  createdAt: true,
  lastTriggered: true,
});

/**
 * Auction Sources - Configurable scraping sources
 */
export const auctionSources = pgTable("auction_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  state: text("state"),
  city: text("city"),
  enabled: boolean("enabled").default(true),
  lastScraped: timestamp("last_scraped"),
  lastSuccessful: timestamp("last_successful"),
  totalDiscovered: integer("total_discovered").default(0),
  totalSaved: integer("total_saved").default(0),
  successRate: real("success_rate").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  nameIdx: index("auction_sources_name_idx").on(table.name),
  enabledIdx: index("auction_sources_enabled_idx").on(table.enabled),
}));

export type AuctionSource = typeof auctionSources.$inferSelect;
export type InsertAuctionSource = typeof auctionSources.$inferInsert;

