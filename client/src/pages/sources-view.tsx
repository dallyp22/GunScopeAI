import { TacticalNav } from '@/components/TacticalNav';
import { useQuery } from '@tanstack/react-query';

interface AuctionSource {
  id: number;
  name: string;
  url: string;
  state: string;
  city: string;
  enabled: boolean;
}

export default function SourcesView() {
  const { data: sources } = useQuery<AuctionSource[]>({
    queryKey: ['auction-sources'],
    queryFn: async () => {
      const response = await fetch('/api/sources');
      if (!response.ok) throw new Error('Failed to fetch sources');
      const data = await response.json();
      return data.sources;
    }
  });

  return (
    <div className="h-screen bg-[#0a0f0d] flex flex-col">
      <TacticalNav />
      
      <div className="flex-1 p-4">
        <div className="tactical-border bg-[#1a1f1d] scanlines p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
              <h2 className="hud-text text-lg uppercase tracking-wider">
                Auction Sources
              </h2>
            </div>
            <div className="text-sm text-[#00ff4166] font-mono">
              {sources?.length || 0} CONFIGURED
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources?.map((source) => (
              <div key={source.id} className="tactical-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-[#00ff41] font-mono font-bold">
                    {source.name}
                  </div>
                  <div className="tactical-badge-green">
                    {source.state}
                  </div>
                </div>
                <div className="text-xs text-[#00ff4166] font-mono mb-2">
                  {source.city}
                </div>
                <div className="text-[10px] text-[#00ff4133] font-mono truncate">
                  {source.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

