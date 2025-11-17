import { db } from '../db.js';
import { userAlerts, firearmsAuctions } from '@shared/firearms-schema';
import { eq, gte } from 'drizzle-orm';

export interface AlertCriteria {
  manufacturer?: string;
  model?: string;
  caliber?: string;
  category?: string;
  condition?: string;
  maxPrice?: number;
  minRarity?: string; // Common, Scarce, Rare, Extremely Rare
  nfaOnly?: boolean;
  estateSalesOnly?: boolean;
}

export interface AlertMatch {
  alertId: number;
  auction: any;
  matchReasons: string[];
}

export class AlertEngine {
  /**
   * Check all active alerts against recent auctions
   */
  async checkAlerts(): Promise<AlertMatch[]> {
    // Get all active alerts
    const alerts = await db
      .select()
      .from(userAlerts)
      .where(eq(userAlerts.active, true));

    if (alerts.length === 0) {
      return [];
    }

    // Get auctions from last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentAuctions = await db
      .select()
      .from(firearmsAuctions)
      .where(gte(firearmsAuctions.scrapedAt, last24Hours));

    const matches: AlertMatch[] = [];

    // Check each alert against each auction
    for (const alert of alerts) {
      const criteria = alert.criteria as AlertCriteria;
      
      for (const auction of recentAuctions) {
        const matchResult = this.matchesCriteria(auction, criteria);
        
        if (matchResult.matches) {
          matches.push({
            alertId: alert.id,
            auction,
            matchReasons: matchResult.reasons
          });
        }
      }
    }

    return matches;
  }

  /**
   * Check if an auction matches alert criteria
   */
  private matchesCriteria(
    auction: any,
    criteria: AlertCriteria
  ): { matches: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check manufacturer
    if (criteria.manufacturer) {
      if (auction.manufacturer?.toLowerCase().includes(criteria.manufacturer.toLowerCase())) {
        reasons.push(`Manufacturer matches: ${auction.manufacturer}`);
      } else {
        return { matches: false, reasons: [] };
      }
    }

    // Check model
    if (criteria.model) {
      if (auction.model?.toLowerCase().includes(criteria.model.toLowerCase())) {
        reasons.push(`Model matches: ${auction.model}`);
      } else {
        return { matches: false, reasons: [] };
      }
    }

    // Check caliber
    if (criteria.caliber) {
      if (auction.caliber?.toLowerCase().includes(criteria.caliber.toLowerCase())) {
        reasons.push(`Caliber matches: ${auction.caliber}`);
      } else {
        return { matches: false, reasons: [] };
      }
    }

    // Check category
    if (criteria.category) {
      if (auction.category === criteria.category) {
        reasons.push(`Category matches: ${auction.category}`);
      } else {
        return { matches: false, reasons: [] };
      }
    }

    // Check condition
    if (criteria.condition) {
      if (auction.condition === criteria.condition) {
        reasons.push(`Condition matches: ${auction.condition}`);
      } else {
        return { matches: false, reasons: [] };
      }
    }

    // Check max price
    if (criteria.maxPrice && auction.currentBid) {
      if (auction.currentBid <= criteria.maxPrice) {
        reasons.push(`Price within budget: $${auction.currentBid} <= $${criteria.maxPrice}`);
      } else {
        return { matches: false, reasons: [] };
      }
    }

    // Check rarity
    if (criteria.minRarity) {
      const rarityLevels = ['Common', 'Scarce', 'Rare', 'Extremely Rare'];
      const minLevel = rarityLevels.indexOf(criteria.minRarity);
      const auctionLevel = rarityLevels.indexOf(auction.rarity || 'Common');
      
      if (auctionLevel >= minLevel) {
        reasons.push(`Rarity meets criteria: ${auction.rarity}`);
      } else {
        return { matches: false, reasons: [] };
      }
    }

    // Check NFA filter
    if (criteria.nfaOnly && !auction.nfaItem) {
      return { matches: false, reasons: [] };
    }
    if (criteria.nfaOnly && auction.nfaItem) {
      reasons.push('NFA item as requested');
    }

    // Check estate sales filter
    if (criteria.estateSalesOnly && !auction.isEstateSale) {
      return { matches: false, reasons: [] };
    }
    if (criteria.estateSalesOnly && auction.isEstateSale) {
      reasons.push('Estate sale as requested');
    }

    return {
      matches: reasons.length > 0,
      reasons
    };
  }

  /**
   * Send alert to user
   * (Placeholder - would integrate with email/SMS service)
   */
  async sendAlert(match: AlertMatch): Promise<void> {
    try {
      // Get alert details
      const alert = await db.query.userAlerts.findFirst({
        where: eq(userAlerts.id, match.alertId)
      });

      if (!alert) {
        return;
      }

      // Log the alert (in production, this would send email/SMS)
      console.log(`
🔔 ALERT TRIGGERED for User ${alert.userId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Alert Type: ${alert.alertType}
Firearm: ${match.auction.manufacturer} ${match.auction.model}
Caliber: ${match.auction.caliber}
Current Bid: $${match.auction.currentBid}
Match Reasons:
${match.matchReasons.map(r => `  • ${r}`).join('\n')}

View Auction: ${match.auction.url}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);

      // Update last triggered timestamp
      await db.update(userAlerts)
        .set({ lastTriggered: new Date() })
        .where(eq(userAlerts.id, match.alertId));

      // In production, integrate with:
      // - SendGrid for email
      // - Twilio for SMS
      // - Push notification service
      // Example:
      // await sendEmail(alert.userId, {
      //   subject: `New ${match.auction.manufacturer} ${match.auction.model} Alert!`,
      //   body: generateAlertEmail(match)
      // });

    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  /**
   * Process all pending alerts
   */
  async processAlerts(): Promise<{
    totalMatches: number;
    alertsSent: number;
    errors: number;
  }> {
    const matches = await this.checkAlerts();
    
    let alertsSent = 0;
    let errors = 0;

    for (const match of matches) {
      try {
        await this.sendAlert(match);
        alertsSent++;
      } catch (error) {
        console.error('Failed to process alert:', error);
        errors++;
      }
    }

    return {
      totalMatches: matches.length,
      alertsSent,
      errors
    };
  }

  /**
   * Create a new alert for a user
   */
  async createAlert(
    userId: number,
    alertType: string,
    criteria: AlertCriteria
  ): Promise<any> {
    const inserted = await db.insert(userAlerts).values({
      userId,
      alertType,
      criteria: criteria as any,
      active: true
    }).returning();

    return inserted[0];
  }

  /**
   * Update an existing alert
   */
  async updateAlert(
    alertId: number,
    criteria: AlertCriteria,
    active?: boolean
  ): Promise<void> {
    const updates: any = { criteria: criteria as any };
    if (active !== undefined) {
      updates.active = active;
    }

    await db.update(userAlerts)
      .set(updates)
      .where(eq(userAlerts.id, alertId));
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: number): Promise<void> {
    await db.delete(userAlerts).where(eq(userAlerts.id, alertId));
  }

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(userAlerts)
      .where(eq(userAlerts.userId, userId));
  }

  /**
   * Get recently triggered alerts for a user
   */
  async getRecentlyTriggered(userId: number, days: number = 7): Promise<any[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return await db
      .select()
      .from(userAlerts)
      .where(
        eq(userAlerts.userId, userId)
      );
    // Would filter by lastTriggered >= cutoff if had proper query builder support
  }
}

export const alertEngine = new AlertEngine();

