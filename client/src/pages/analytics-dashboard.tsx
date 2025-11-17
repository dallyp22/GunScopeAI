import { TacticalNav } from '@/components/TacticalNav';
import { MetricsDashboard } from '@/components/MetricsDashboard';
import { LiveAuctionFeed } from '@/components/LiveAuctionFeed';
import { PriceCharts } from '@/components/PriceCharts';
import { OpportunitiesPanel } from '@/components/OpportunitiesPanel';
import { CompetitorIntel } from '@/components/CompetitorIntel';
import { ScraperControls } from '@/components/ScraperControls';

export default function AnalyticsDashboard() {
  return (
    <div className="h-screen bg-[#0f1419] flex flex-col">
      {/* Navigation */}
      <TacticalNav />
      
      {/* Metrics Cards */}
      <MetricsDashboard />
      
      {/* Main Content Grid - 40% / 35% / 25% */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        
        {/* Left Column (40%) - Live Feed & Scraper */}
        <div className="col-span-5 flex flex-col gap-4 overflow-auto modern-scrollbar">
          <ScraperControls />
          <div className="flex-1 overflow-hidden">
            <LiveAuctionFeed />
          </div>
          <OpportunitiesPanel />
        </div>
        
        {/* Center Column (35%) - Price Chart */}
        <div className="col-span-4">
          <PriceCharts />
        </div>
        
        {/* Right Column (25%) - Competitor Intel */}
        <div className="col-span-3">
          <CompetitorIntel />
        </div>
      </div>
    </div>
  );
}
