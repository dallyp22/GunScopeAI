import { firecrawlService } from './firecrawl.js';
import { db } from '../db.js';
import { firearmsAuctions } from '@shared/firearms-schema';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY2 || process.env.OPENAI_API_KEY || ''
});

export interface EstateSaleAlert {
  url: string;
  title: string;
  location: string;
  estimatedFirearms: number;
  collectionQuality: 'Low' | 'Medium' | 'High' | 'Museum';
  notableItems: string[];
  contactInfo: {
    handler: string;
    phone?: string;
    email?: string;
  };
  saleDate: Date | null;
  daysUntilSale: number;
}

export class EstateMonitorService {
  // Estate sale sources to monitor
  private sources = [
    { name: 'EstateSales.net', url: 'https://www.estatesales.net' },
    { name: 'AuctionZip', url: 'https://www.auctionzip.com' },
    { name: 'EstateSale.com', url: 'https://www.estatesale.com' }
  ];

  /**
   * Scan estate sale websites for firearms-related sales
   */
  async scanEstateSales(state?: string): Promise<EstateSaleAlert[]> {
    const alerts: EstateSaleAlert[] = [];

    for (const source of this.sources) {
      try {
        console.log(`Scanning ${source.name} for firearms estate sales...`);
        
        // Build search URL with state filter if provided
        let searchUrl = source.url;
        if (state) {
          searchUrl += `/search?state=${state}&keywords=firearms+guns`;
        }

        // Scrape the page
        const response = await firecrawlService.scrapeUrl(searchUrl, {
          formats: ['markdown', 'html'],
          wait: 2000
        });

        if (!response || !response.data) {
          continue;
        }

        // Use GPT-4o to analyze for firearms estate sales
        const analysis = await this.analyzeForFirearms(
          response.data.markdown || response.data.html || ''
        );

        if (analysis.alerts.length > 0) {
          alerts.push(...analysis.alerts);
        }
      } catch (error) {
        console.error(`Failed to scan ${source.name}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Analyze estate sale listing to detect firearms and assess collection quality
   */
  private async analyzeForFirearms(content: string): Promise<{ alerts: EstateSaleAlert[] }> {
    try {
      const prompt = `Analyze this estate sale listing content and identify any sales that include firearms.

Extract the following information for each firearms-related estate sale:
1. URL of the sale
2. Title/name of the sale
3. Location (city, state)
4. Estimated number of firearms (based on mentions like "gun collection", "firearms", "rifles", etc.)
5. Collection quality: Low (< 5 items), Medium (5-20 items), High (20-100 items), Museum (100+ items or very rare items)
6. Notable items mentioned (specific brands, models, rare firearms)
7. Contact information (estate sale company, phone, email)
8. Sale date
9. Days until sale

Look for keywords:
- "gun collection", "firearms", "rifles", "shotguns", "handguns", "pistols"
- "military collection", "WWII", "antique firearms"
- "gun safe", "ammunition", "shooting supplies"
- Brand names: Colt, Winchester, Remington, Smith & Wesson, etc.

Return as JSON:
{
  "alerts": [
    {
      "url": "string",
      "title": "string",
      "location": "string",
      "estimatedFirearms": number,
      "collectionQuality": "Low" | "Medium" | "High" | "Museum",
      "notableItems": ["string"],
      "contactInfo": {
        "handler": "string",
        "phone": "string" or null,
        "email": "string" or null
      },
      "saleDate": "ISO date" or null,
      "daysUntilSale": number
    }
  ]
}

Content to analyze:
${content.substring(0, 5000)} // Limit content length`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert at analyzing estate sale listings to identify firearms-related sales." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"alerts":[]}');
      
      // Convert sale dates to Date objects and calculate days until sale
      if (result.alerts) {
        result.alerts = result.alerts.map((alert: any) => ({
          ...alert,
          saleDate: alert.saleDate ? new Date(alert.saleDate) : null,
          daysUntilSale: alert.saleDate ? 
            Math.ceil((new Date(alert.saleDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
            0
        }));
      }

      return result;
    } catch (error) {
      console.error('Failed to analyze content for firearms:', error);
      return { alerts: [] };
    }
  }

  /**
   * Monitor a specific URL for firearms content
   */
  async monitorUrl(url: string): Promise<EstateSaleAlert | null> {
    try {
      const response = await firecrawlService.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        wait: 2000
      });

      if (!response || !response.data) {
        return null;
      }

      const analysis = await this.analyzeForFirearms(
        response.data.markdown || response.data.html || ''
      );

      return analysis.alerts.length > 0 ? analysis.alerts[0] : null;
    } catch (error) {
      console.error(`Failed to monitor URL ${url}:`, error);
      return null;
    }
  }

  /**
   * Get upcoming estate sales with firearms from database
   */
  async getUpcomingEstateSales(): Promise<any[]> {
    const estateSales = await db
      .select()
      .from(firearmsAuctions)
      .where(firearmsAuctions.isEstateSale);

    return estateSales.map(sale => ({
      id: sale.id,
      title: sale.title,
      url: sale.url,
      location: `${sale.city}, ${sale.state}`,
      collectionSize: sale.estateSize,
      collectionName: sale.collectionName,
      auctionDate: sale.auctionDate,
      firearms: {
        manufacturer: sale.manufacturer,
        model: sale.model,
        caliber: sale.caliber
      }
    }));
  }

  /**
   * Flag high-value estate sales
   * Criteria: Large collections, rare items, or museum-quality pieces
   */
  async flagHighValueEstates(): Promise<EstateSaleAlert[]> {
    const allAlerts = await this.scanEstateSales();
    
    return allAlerts.filter(alert => 
      alert.collectionQuality === 'Museum' || 
      alert.collectionQuality === 'High' ||
      alert.estimatedFirearms >= 20 ||
      alert.notableItems.length >= 3
    );
  }
}

export const estateMonitorService = new EstateMonitorService();

