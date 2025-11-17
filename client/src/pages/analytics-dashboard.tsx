import { MetricsDashboard } from '@/components/MetricsDashboard';
import { LiveAuctionFeed } from '@/components/LiveAuctionFeed';
import { PriceCharts } from '@/components/PriceCharts';
import { OpportunitiesPanel } from '@/components/OpportunitiesPanel';
import { CompetitorIntel } from '@/components/CompetitorIntel';

function EstateSaleAlerts() {
  return (
    <div className="tactical-border bg-[#1a1f1d] scanlines p-4 h-[calc(40vh-0.5rem)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-[#ff0000] rounded-full animate-pulse" />
        <h3 className="text-[#ff0000] text-sm uppercase tracking-wider font-mono">
          Estate Sale Alerts
        </h3>
      </div>
      <div className="text-center py-8">
        <div className="text-[#00ff4166] font-mono text-xs">
          Monitoring active...
        </div>
        <div className="text-[#00ff4133] font-mono text-[10px] mt-2">
          No high-value estates detected
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  return (
    <div className="h-screen bg-[#0a0f0d] text-[#00ff41] font-mono overflow-hidden">
      {/* Top Metrics Bar */}
      <div className="h-16 border-b border-[#00ff4133] bg-[#1a1f1d] scanlines">
        <MetricsDashboard />
      </div>
      
      {/* Main Grid Layout */}
      <div className="h-[calc(100vh-4rem)] grid grid-cols-12 gap-1 p-1 bg-[#0a0f0d]">
        
        {/* Left Column: Opportunities & Estate Alerts */}
        <div className="col-span-3 flex flex-col gap-1">
          <div className="flex-1">
            <OpportunitiesPanel />
          </div>
          <div>
            <EstateSaleAlerts />
          </div>
        </div>
        
        {/* Center Column: Live Feed */}
        <div className="col-span-6">
          <LiveAuctionFeed />
        </div>
        
        {/* Right Column: Charts & Intel */}
        <div className="col-span-3 flex flex-col gap-1">
          <div>
            <PriceCharts />
          </div>
          <div className="flex-1">
            <CompetitorIntel />
          </div>
        </div>
      </div>
    </div>
  );
}

