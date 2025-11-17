import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

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
    refetchInterval: 120000 // Refresh every 2 minutes
  });

  return (
    <div className="tactical-border bg-[#1a1f1d] scanlines p-4 h-[60vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-[#ffb000] rounded-full animate-pulse tactical-pulse" />
        <h3 className="text-[#ffb000] text-sm uppercase tracking-wider font-mono">
          High Priority Targets
        </h3>
      </div>

      {!opportunities || opportunities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-[#00ff4166] font-mono text-xs">
            No opportunities detected
          </div>
          <div className="text-[#00ff4133] font-mono text-[10px] mt-2">
            System scanning...
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <a
              key={opp.id}
              href={opp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-3 p-3 border border-[#ffb00033] hover:border-[#ffb000] cursor-pointer transition-colors corner-brackets"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-[#00ff41] font-mono truncate pr-2">
                  {opp.manufacturer} {opp.model}
                </span>
                <span className="text-xs text-[#ffb000] font-mono font-bold whitespace-nowrap">
                  -{opp.deviation}%
                </span>
              </div>
              
              <div className="text-[10px] text-[#00ff4166] font-mono">
                Current: <span className="text-[#00ff41]">${opp.currentBid.toLocaleString()}</span>
                {' • '}
                Est: <span className="text-[#ffb000]">${opp.estimate.toLocaleString()}</span>
              </div>
              
              <div className="text-[10px] text-[#ffb000] font-mono mt-1">
                Ends: {opp.auctionDate ? formatDistanceToNow(new Date(opp.auctionDate), { addSuffix: true }) : 'TBD'}
              </div>

              {/* Visual savings indicator */}
              <div className="mt-2 h-1 bg-[#00ff4133] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#ffb000] tactical-progress-fill"
                  style={{ width: `${Math.min(opp.deviation, 100)}%` }}
                />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Summary footer */}
      {opportunities && opportunities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#00ff4133]">
          <div className="text-[10px] text-[#00ff4166] font-mono text-center">
            {opportunities.length} OPPORTUNITIES IDENTIFIED
          </div>
          <div className="text-[10px] text-[#ffb000] font-mono text-center mt-1">
            POTENTIAL SAVINGS: ${opportunities.reduce((sum, opp) => sum + (opp.estimate - opp.currentBid), 0).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

