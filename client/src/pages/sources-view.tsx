import { useState } from 'react';
import { TacticalNav } from '@/components/TacticalNav';
import { useQuery } from '@tanstack/react-query';

interface AuctionSource {
  id: number;
  name: string;
  url: string;
  state: string;
  city: string;
  category: string;
  enabled: boolean;
}

export default function SourcesView() {
  const [activeCategory, setActiveCategory] = useState<'estate' | 'competitor'>('estate');

  const { data: sources } = useQuery<AuctionSource[]>({
    queryKey: ['auction-sources'],
    queryFn: async () => {
      const response = await fetch('/api/sources');
      if (!response.ok) throw new Error('Failed to fetch sources');
      const data = await response.json();
      return data.sources;
    }
  });

  const filteredSources = sources?.filter(s => s.category === activeCategory) || [];

  return (
    <div className="h-screen bg-[#0a0f0d] flex flex-col">
      <TacticalNav />
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="tactical-border bg-[#1a1f1d] scanlines p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
              <h2 className="hud-text text-lg uppercase tracking-wider">
                Auction Sources
              </h2>
            </div>
            <div className="text-sm text-[#00ff4166] font-mono">
              {filteredSources.length} {activeCategory.toUpperCase()}
            </div>
          </div>

          {/* Category Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveCategory('estate')}
              className={`px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all ${
                activeCategory === 'estate'
                  ? 'bg-[#252a28] text-[#00ff41] border border-[#00ff4166] shadow-[0_0_10px_rgba(0,255,65,0.3)]'
                  : 'bg-transparent text-[#00ff4166] border border-[#00ff4133] hover:text-[#00ff41]'
              }`}
            >
              🏚️ Estate Auctions ({sources?.filter(s => s.category === 'estate').length || 0})
            </button>
            <button
              onClick={() => setActiveCategory('competitor')}
              className={`px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all ${
                activeCategory === 'competitor'
                  ? 'bg-[#252a28] text-[#00ff41] border border-[#00ff4166] shadow-[0_0_10px_rgba(0,255,65,0.3)]'
                  : 'bg-transparent text-[#00ff4166] border border-[#00ff4133] hover:text-[#00ff41]'
              }`}
            >
              🎯 Competitors ({sources?.filter(s => s.category === 'competitor').length || 0})
            </button>
          </div>

          {/* Sources Grid */}
          {filteredSources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSources.map((source) => (
                <div key={source.id} className="tactical-card p-4 hover:border-[#00ff4166] transition-all">
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
          ) : (
            <div className="text-center py-12">
              <div className="text-[#00ff4166] font-mono text-sm mb-2">
                No {activeCategory} sources configured
              </div>
              <div className="text-[#00ff4133] font-mono text-xs">
                {activeCategory === 'competitor' && 'Add competitor auction houses to track'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

