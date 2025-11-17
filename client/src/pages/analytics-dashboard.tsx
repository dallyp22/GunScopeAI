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
      
      {/* Main Content Grid - Optimized Information Hierarchy: 25% / 50% / 25% */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-auto modern-scrollbar">
        
        {/* Left Column (25%) - Monitoring & Alerts */}
        <div className="col-span-3 flex flex-col gap-6 min-h-0">
          {/* HIGH PRIORITY TARGETS - Top position for immediate action */}
          <div className="flex-1 min-h-[400px]">
            <OpportunitiesPanel />
          </div>
          
          {/* SCRAPER CONTROLS - Secondary importance, bottom position */}
          <div className="flex-shrink-0">
            <ScraperControls />
          </div>
        </div>
        
        {/* Center Column (50%) - Primary Data & Analysis */}
        <div className="col-span-6 flex flex-col gap-6 min-h-0">
          {/* LIVE FEED - Top section, main interaction area */}
          <div className="flex-1 min-h-[400px] overflow-hidden">
            <LiveAuctionFeed />
          </div>
          
          {/* PRICE TRENDS - Bottom section, full width for better readability */}
          <div className="h-80 flex-shrink-0">
            <PriceCharts />
          </div>
        </div>
        
        {/* Right Column (25%) - Market Context */}
        <div className="col-span-3 flex flex-col gap-6 min-h-0">
          {/* COMPETITOR INTEL - Top position */}
          <div className="flex-1 min-h-[400px]">
            <CompetitorIntel />
          </div>
        </div>
      </div>
    </div>
  );
}
