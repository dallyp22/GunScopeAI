import OpenAI from 'openai';
import { db } from '../db.js';
import { firearmsAuctions } from '@shared/firearms-schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY2 || process.env.OPENAI_API_KEY || ''
});

export interface FirearmEnrichmentResult {
  // Firearm identification
  manufacturer: string | null;
  model: string | null;
  caliber: string | null;
  serialNumber: string | null;
  yearManufactured: number | null;
  category: string | null;
  subCategory: string | null;
  
  // Condition assessment
  condition: string | null;
  boreCondition: string | null;
  finishPercentage: number | null;
  originalParts: boolean | null;
  mechanicalFunction: string | null;
  
  // Value intelligence
  provenance: string | null;
  rarity: string | null;
  desirability: number | null;
  investmentGrade: boolean | null;
  keyFeatures: string[];
  
  // Legal/Transfer
  transferType: string | null;
  nfaItem: boolean;
  restrictions: string[];
  
  // Auction details
  auctionHouse: string | null;
  lotNumber: string | null;
  estimateLow: number | null;
  estimateHigh: number | null;
  startingBid: number | null;
  currentBid: number | null;
  
  // Extras
  includedAccessories: string[];
  originalBox: boolean | null;
  paperwork: boolean | null;
  specialFeatures: string[];
  
  // Estate sale info
  isEstateSale: boolean;
  collectionSize: string | null;
  collectionName: string | null;
  
  // Status
  soldStatus: string | null;
}

const FIREARM_ENRICHMENT_PROMPT = `You are an expert firearms appraiser and historian. Your task is to extract detailed information from firearms auction listings.

Analyze the provided auction data and extract ALL available information into a structured format. Be thorough and precise.

CRITICAL INSTRUCTIONS:
1. **Firearm Identification**: Extract manufacturer, model, caliber, serial number (if visible), and estimated year of manufacture.
2. **Category Classification**: Determine:
   - Primary category: Handgun, Rifle, Shotgun, Machine Gun, Antique, Military
   - Sub-category: Revolver, Semi-Auto, Bolt-Action, Lever-Action, Pump-Action, Single-Shot, etc.
3. **Condition Assessment**: Extract details about:
   - Overall grade: NIB (New In Box), Excellent, Very Good, Good, Fair, Poor
   - Bore condition: Bright, Good, Fair, Dark, Pitted
   - Finish percentage: 0-100%
   - Original parts: Are all parts original or have some been replaced?
   - Mechanical function: Does it function properly?
   - Notable issues: Any damage, wear, or defects
4. **Value Factors**:
   - Provenance: History, previous owners, special significance (e.g., "WWII bring-back", "Police trade-in", "Celebrity owned")
   - Rarity: Common, Scarce, Rare, Extremely Rare
   - Desirability: Rate 1-10 based on collector demand
   - Investment grade: Is this a collectible investment piece?
   - Key features: What makes this firearm valuable or special?
5. **Legal Requirements**:
   - Transfer type: Standard (FFL), C&R (Curio & Relic), NFA (requires tax stamp), Antique (pre-1899)
   - NFA item: Is this a machine gun, SBR, SBS, suppressor, or other NFA item?
   - Restrictions: Any state/federal restrictions
6. **Auction Information**:
   - Auction house name
   - Lot number
   - Estimate range (low and high)
   - Starting bid
   - Current bid
7. **Included Items**:
   - Accessories: Magazines, holsters, cases, scopes, etc.
   - Original box: Does it include the original box?
   - Paperwork: Manual, warranty, test targets, etc.
   - Special features: Engraving, custom work, unique characteristics
8. **Estate Sale Detection**:
   - Is this from an estate sale or private collection?
   - Collection size: Small (<10 items), Medium (10-50), Large (50-100), Collection (100+)
   - Collection name: If from a named collection
9. **SOLD STATUS**: Check if this firearm is SOLD, CLOSED, or NO LONGER AVAILABLE:
   - Look for: "SOLD", "Sale Closed", "Auction Closed", "No Longer Available"
   - Check for past tense: "was sold", "has been sold", "auction completed"
   - Return "sold" if definitely sold, "active" if still available, "unknown" if unclear

Return your analysis as a JSON object with the following structure:
{
  "identification": {
    "manufacturer": "Colt" or null,
    "model": "Python" or null,
    "caliber": ".357 Magnum" or null,
    "serialNumber": "12345" or null,
    "yearManufactured": 1965 or null,
    "category": "Handgun" | "Rifle" | "Shotgun" | "Machine Gun" | "Antique" | "Military",
    "subCategory": "Revolver" or "Semi-Auto" or "Bolt-Action" etc.
  },
  "condition": {
    "grade": "NIB" | "Excellent" | "Very Good" | "Good" | "Fair" | "Poor",
    "boreCondition": "Bright" or "Good" or "Fair" etc.,
    "finishPercentage": 95 or null,
    "originalParts": true or false,
    "mechanicalFunction": "Fully functional" or description,
    "notableIssues": ["Minor holster wear", "Small ding on barrel"] or []
  },
  "value": {
    "provenance": "WWII bring-back" or null,
    "rarity": "Common" | "Scarce" | "Rare" | "Extremely Rare",
    "desirability": 8 (1-10 scale),
    "investmentGrade": true or false,
    "keyFeatures": ["Original finish", "Matching numbers", "Rare variation"]
  },
  "legal": {
    "transferType": "Standard" | "C&R" | "NFA" | "Antique",
    "nfaItem": true or false,
    "restrictions": ["CA restricted", "Requires tax stamp"] or []
  },
  "auction": {
    "auctionHouse": "Rock Island Auction Company" or null,
    "lotNumber": "1234" or null,
    "estimateRange": {"low": 2000, "high": 3000} or null,
    "startingBid": 1500 or null,
    "currentBid": 2200 or null
  },
  "extras": {
    "includedAccessories": ["2 magazines", "Original holster", "Cleaning kit"] or [],
    "originalBox": true or false,
    "paperwork": true or false,
    "specialFeatures": ["Factory engraved", "Pearl grips", "Custom trigger work"] or []
  },
  "estateSale": {
    "isEstateSale": true or false,
    "collectionSize": "Small" | "Medium" | "Large" | "Collection" or null,
    "collectionName": "John Smith Collection" or null
  },
  "soldStatus": "sold" | "active" | "unknown",
  "soldIndicators": "Any text indicating item was sold" or null
}

Be precise, thorough, and extract EVERYTHING available. If information is not found, use null or empty arrays/objects as appropriate.`;

export class FirearmEnrichmentService {
  /**
   * Enrich a single firearms auction with AI-extracted comprehensive data
   */
  async enrichFirearmAuction(auctionId: number): Promise<FirearmEnrichmentResult> {
    try {
      // Get auction
      const auction = await db.query.firearmsAuctions.findFirst({
        where: eq(firearmsAuctions.id, auctionId)
      });

      if (!auction) {
        throw new Error(`Firearms auction ${auctionId} not found`);
      }

      // Update status to processing
      await db.update(firearmsAuctions)
        .set({ enrichmentStatus: 'processing' })
        .where(eq(firearmsAuctions.id, auctionId));

      // Prepare data for OpenAI
      const auctionData = {
        title: auction.title,
        description: auction.description,
        url: auction.url,
        sourceWebsite: auction.sourceWebsite,
        currentBid: auction.currentBid,
        startingBid: auction.startingBid,
        estimateLow: auction.estimateLow,
        estimateHigh: auction.estimateHigh,
        lotNumber: auction.lotNumber,
        auctionDate: auction.auctionDate
      };

      // Call OpenAI for enrichment
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: FIREARM_ENRICHMENT_PROMPT
          },
          {
            role: "user",
            content: `Analyze this firearms auction listing:\n\n${JSON.stringify(auctionData, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const enrichedData = JSON.parse(completion.choices[0].message.content || '{}');

      // Prepare the result
      const result: FirearmEnrichmentResult = {
        // Identification
        manufacturer: enrichedData.identification?.manufacturer || null,
        model: enrichedData.identification?.model || null,
        caliber: enrichedData.identification?.caliber || null,
        serialNumber: enrichedData.identification?.serialNumber || null,
        yearManufactured: enrichedData.identification?.yearManufactured || null,
        category: enrichedData.identification?.category || null,
        subCategory: enrichedData.identification?.subCategory || null,
        
        // Condition
        condition: enrichedData.condition?.grade || null,
        boreCondition: enrichedData.condition?.boreCondition || null,
        finishPercentage: enrichedData.condition?.finishPercentage || null,
        originalParts: enrichedData.condition?.originalParts || null,
        mechanicalFunction: enrichedData.condition?.mechanicalFunction || null,
        
        // Value
        provenance: enrichedData.value?.provenance || null,
        rarity: enrichedData.value?.rarity || null,
        desirability: enrichedData.value?.desirability || null,
        investmentGrade: enrichedData.value?.investmentGrade || false,
        keyFeatures: enrichedData.value?.keyFeatures || [],
        
        // Legal
        transferType: enrichedData.legal?.transferType || null,
        nfaItem: enrichedData.legal?.nfaItem || false,
        restrictions: enrichedData.legal?.restrictions || [],
        
        // Auction
        auctionHouse: enrichedData.auction?.auctionHouse || auction.auctionHouse,
        lotNumber: enrichedData.auction?.lotNumber || auction.lotNumber,
        estimateLow: enrichedData.auction?.estimateRange?.low || auction.estimateLow,
        estimateHigh: enrichedData.auction?.estimateRange?.high || auction.estimateHigh,
        startingBid: enrichedData.auction?.startingBid || auction.startingBid,
        currentBid: enrichedData.auction?.currentBid || auction.currentBid,
        
        // Extras
        includedAccessories: enrichedData.extras?.includedAccessories || [],
        originalBox: enrichedData.extras?.originalBox || null,
        paperwork: enrichedData.extras?.paperwork || null,
        specialFeatures: enrichedData.extras?.specialFeatures || [],
        
        // Estate sale
        isEstateSale: enrichedData.estateSale?.isEstateSale || false,
        collectionSize: enrichedData.estateSale?.collectionSize || null,
        collectionName: enrichedData.estateSale?.collectionName || null,
        
        // Status
        soldStatus: enrichedData.soldStatus || null
      };

      // Update the database with enriched data
      await db.update(firearmsAuctions)
        .set({
          manufacturer: result.manufacturer,
          model: result.model,
          caliber: result.caliber,
          serialNumber: result.serialNumber,
          yearManufactured: result.yearManufactured,
          category: result.category,
          subCategory: result.subCategory,
          condition: result.condition,
          boreCondition: result.boreCondition,
          finishPercentage: result.finishPercentage,
          originalParts: result.originalParts,
          mechanicalFunction: result.mechanicalFunction,
          provenance: result.provenance,
          rarity: result.rarity,
          desirability: result.desirability,
          investmentGrade: result.investmentGrade,
          transferType: result.transferType,
          nfaItem: result.nfaItem,
          auctionHouse: result.auctionHouse,
          lotNumber: result.lotNumber,
          estimateLow: result.estimateLow,
          estimateHigh: result.estimateHigh,
          startingBid: result.startingBid,
          currentBid: result.currentBid,
          includedAccessories: result.includedAccessories.length > 0 ? result.includedAccessories : null,
          originalBox: result.originalBox,
          paperwork: result.paperwork,
          isEstateSale: result.isEstateSale,
          estateSize: result.collectionSize,
          collectionName: result.collectionName,
          status: result.soldStatus === 'sold' ? 'sold' : (result.soldStatus === 'active' ? 'active' : auction.status),
          aiExtractedData: enrichedData,
          enrichmentStatus: 'completed',
          enrichedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(firearmsAuctions.id, auctionId));

      return result;
    } catch (error) {
      console.error(`Failed to enrich firearms auction ${auctionId}:`, error);
      
      // Update status to failed
      await db.update(firearmsAuctions)
        .set({ 
          enrichmentStatus: 'failed',
          updatedAt: new Date()
        })
        .where(eq(firearmsAuctions.id, auctionId));
      
      throw error;
    }
  }

  /**
   * Enrich multiple firearms auctions in batch
   */
  async enrichBatch(auctionIds: number[], concurrency: number = 5): Promise<{
    successful: number;
    failed: number;
    errors: Array<{id: number, error: string}>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{id: number, error: string}>
    };

    // Process in batches for concurrency control
    for (let i = 0; i < auctionIds.length; i += concurrency) {
      const batch = auctionIds.slice(i, i + concurrency);
      const promises = batch.map(async (id) => {
        try {
          await this.enrichFirearmAuction(id);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Get enrichment statistics
   */
  async getEnrichmentStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const stats = await db
      .select({
        status: firearmsAuctions.enrichmentStatus
      })
      .from(firearmsAuctions);

    return {
      total: stats.length,
      pending: stats.filter(s => s.status === 'pending').length,
      processing: stats.filter(s => s.status === 'processing').length,
      completed: stats.filter(s => s.status === 'completed').length,
      failed: stats.filter(s => s.status === 'failed').length
    };
  }
}

export const firearmEnrichmentService = new FirearmEnrichmentService();

