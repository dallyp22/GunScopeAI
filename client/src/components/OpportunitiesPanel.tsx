import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Opportunity {
  id: number;
  title: string;
  manufacturer: string;
  model: string;
  currentBid: number;
  estimate: number;
  deviation: number;
  auctionDate: Date;
  url: string;
}

export function OpportunitiesPanel() {
  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const response = await fetch('/api/intelligence/opportunities');
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      const data = await response.json();
      return data.opportunities;
    },
    refetchInterval: 120000
  });

  return (
    <div className="modern-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#F59E0B] rounded-full subtle-pulse" />
          <h3 className="text-sm font-semibold text-white">
            High Priority Targets
          </h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="text-xs text-[#00D4FF] font-medium cursor-help">
                {opportunities?.length || 0} found
              </div>
            </TooltipTrigger>
            <TooltipContent className="frosted-glass border border-[#374151] text-white">
              <p>Items priced significantly below market average</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {!opportunities || opportunities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <div className="text-[#6B7280] text-sm mb-2">
              No opportunities detected
            </div>
            <div className="text-[#6B7280] text-xs">
              System scanning...
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto modern-scrollbar space-y-3">
          {opportunities.map((opp) => (
            <a
              key={opp.id}
              href={opp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg bg-[#2a3040] border border-[#374151] hover:border-[#00D4FF] transition-all smooth-hover"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-2">
                  <div className="text-sm font-medium text-white mb-1">
                    {opp.manufacturer} {opp.model}
                  </div>
                </div>
                <div className="badge-warning font-semibold">
                  -{opp.deviation}%
                </div>
              </div>
              
              {/* Pricing */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Current</span>
                  <span className="text-[#10B981] font-semibold data-value">
                    ${opp.currentBid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Estimated</span>
                  <span className="text-[#F59E0B] font-semibold data-value">
                    ${opp.estimate.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Potential Savings</span>
                  <span className="text-[#00D4FF] font-semibold data-value">
                    ${(opp.estimate - opp.currentBid).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="modern-progress-bar mb-2">
                <div 
                  className="h-full bg-[#F59E0B] rounded-full transition-all"
                  style={{ width: `${Math.min(opp.deviation, 100)}%` }}
                />
              </div>

              {/* Footer */}
              <div className="text-xs text-[#6B7280]">
                Ends {opp.auctionDate ? formatDistanceToNow(new Date(opp.auctionDate), { addSuffix: true }) : 'TBD'}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Summary */}
      {opportunities && opportunities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#374151]">
          <div className="text-xs text-[#9CA3AF] text-center">
            {opportunities.length} opportunities • Potential savings
          </div>
          <div className="text-sm text-[#00D4FF] font-semibold text-center mt-1 data-value">
            ${opportunities.reduce((sum, opp) => sum + (opp.estimate - opp.currentBid), 0).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
