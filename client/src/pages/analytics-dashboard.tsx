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
      
      {/* Main Content Grid - More balanced spacing */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Left Column (33%) - Live Feed & Scraper */}
        <div className="col-span-4 flex flex-col gap-6 overflow-auto modern-scrollbar">
          <ScraperControls />
          <div className="flex-1 overflow-hidden">
            <LiveAuctionFeed />
          </div>
          <OpportunitiesPanel />
        </div>
        
        {/* Center Column (33%) - Price Chart */}
        <div className="col-span-4 flex flex-col gap-6">
          <PriceCharts />
        </div>
        
        {/* Right Column (33%) - Competitor Intel */}
        <div className="col-span-4 flex flex-col gap-6">
          <CompetitorIntel />
        </div>
      </div>
    </div>
  );
}
