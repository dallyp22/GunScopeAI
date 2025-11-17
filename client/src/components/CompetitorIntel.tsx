import { useQuery } from '@tanstack/react-query';

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
    refetchInterval: 300000 // 5 minutes
  });

  return (
    <div className="tactical-border bg-[#1a1f1d] p-4 scanlines">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-[#hud-blue] rounded-full" />
        <h3 className="text-[#hud-blue] text-sm uppercase tracking-wider font-mono">
          Competitor Intel
        </h3>
      </div>
      
      {!competitors || competitors.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-[#00ff4166] font-mono text-xs">
            No competitor data
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
          {competitors.slice(0, 8).map((comp, index) => (
            <div key={index} className="border-b border-[#00ff4133] pb-3 last:border-0">
              {/* House name and realization rate */}
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-[#00ff41] font-mono truncate pr-2">
                  {comp.name}
                </span>
                <span className="text-xs text-[#ffb000] font-mono whitespace-nowrap">
                  {comp.realizationRate}%
                </span>
              </div>

              {/* Market share bar */}
              <div className="h-2 bg-[#00ff4133] rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-gradient-to-r from-[#00ff41] to-[#hud-blue] transition-all duration-300"
                  style={{ width: `${comp.marketShare}%` }}
                />
              </div>

              {/* Stats row */}
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#00ff4166]">
                  Share: {comp.marketShare.toFixed(1)}%
                </span>
                <span className="text-[#00ff4166]">
                  Vol: {comp.totalVolume}
                </span>
                <span className="text-[#00ff41]">
                  Avg: ${comp.avgSalePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer summary */}
      {competitors && competitors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#00ff4133]">
          <div className="text-[10px] text-[#00ff4166] font-mono text-center">
            {competitors.length} AUCTION HOUSES TRACKED
          </div>
          <div className="text-[10px] text-[#00ff41] font-mono text-center mt-1">
            TOTAL VOLUME: {competitors.reduce((sum, c) => sum + c.totalVolume, 0)}
          </div>
        </div>
      )}
    </div>
  );
}

