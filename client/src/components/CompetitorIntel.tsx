import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Competitor {
  name: string;
  category: string;
  avgSalePrice: number;
  totalVolume: number;
  marketShare: number;
  realizationRate: number;
}

export function CompetitorIntel() {
  const { data: competitors } = useQuery<Competitor[]>({
    queryKey: ['competitor-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/intelligence/competitors');
      if (!response.ok) throw new Error('Failed to fetch competitors');
      const data = await response.json();
      return data.competitors;
    },
    refetchInterval: 300000
  });

  return (
    <div className="modern-card h-full flex flex-col p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Competitor Intel
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="text-xs text-[#00D4FF] font-medium cursor-help">
                {competitors?.length || 0} tracked
              </div>
            </TooltipTrigger>
            <TooltipContent className="frosted-glass border border-[#374151] text-white">
              <p>Auction houses being monitored for market intelligence</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {!competitors || competitors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <div className="text-[#6B7280] text-sm">
              No competitor data
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto modern-scrollbar space-y-3">
          {competitors.slice(0, 8).map((comp, index) => (
            <div key={index} className="p-4 rounded-lg bg-[#2a3040] hover:bg-[#2f3541] transition-all smooth-hover">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="text-sm font-medium text-white flex-1">
                  {comp.name}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={`text-sm font-semibold cursor-help ${
                        comp.realizationRate >= 100 ? 'text-[#10B981]' : 
                        comp.realizationRate >= 90 ? 'text-[#F59E0B]' : 
                        'text-[#EF4444]'
                      }`}>
                        {comp.realizationRate}%
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="frosted-glass border border-[#374151] text-white">
                      <p>Realization rate (final price vs estimate)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Market Share Bar */}
              <div className="modern-progress-bar mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#00D4FF] to-[#10B981] rounded-full transition-all duration-300"
                  style={{ width: `${comp.marketShare}%` }}
                />
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-left">
                      <div className="text-[#9CA3AF]">Share</div>
                      <div className="text-white font-medium data-value">
                        {comp.marketShare.toFixed(1)}%
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="frosted-glass border border-[#374151] text-white">
                      <p>Market share by volume</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-center">
                      <div className="text-[#9CA3AF]">Volume</div>
                      <div className="text-white font-medium data-value">
                        {comp.totalVolume}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="frosted-glass border border-[#374151] text-white">
                      <p>Total auctions tracked</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-right">
                      <div className="text-[#9CA3AF]">Avg</div>
                      <div className="text-white font-medium data-value">
                        ${comp.avgSalePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="frosted-glass border border-[#374151] text-white">
                      <p>Average sale price</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Summary */}
      {competitors && competitors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#374151]">
          <div className="text-xs text-[#9CA3AF] text-center">
            {competitors.length} auction houses tracked
          </div>
          <div className="text-xs text-[#00D4FF] font-medium text-center mt-1">
            Total Volume: {competitors.reduce((sum, c) => sum + c.totalVolume, 0).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
