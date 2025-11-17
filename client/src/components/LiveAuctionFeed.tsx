import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface FirearmAuction {
  id: number;
  title: string;
  manufacturer: string | null;
  model: string | null;
  caliber: string | null;
  category: string | null;
  condition: string | null;
  currentBid: number | null;
  estimateLow: number | null;
  estimateHigh: number | null;
  auctionDate: Date | null;
  auctionHouse: string | null;
  lotNumber: string | null;
  rarity: string | null;
  nfaItem: boolean;
  isEstateSale: boolean;
  url: string;
}

function AuctionCard({ auction }: { auction: FirearmAuction }) {
  const getConditionColor = (condition: string | null) => {
    switch (condition) {
      case 'NIB':
      case 'Excellent':
        return 'text-[#00ff41]';
      case 'Very Good':
      case 'Good':
        return 'text-[#ffb000]';
      default:
        return 'text-[#00ff4166]';
    }
  };

  const getRarityColor = (rarity: string | null) => {
    switch (rarity) {
      case 'Extremely Rare':
        return 'text-[#ff0000]';
      case 'Rare':
        return 'text-[#ffb000]';
      case 'Scarce':
        return 'text-[#hud-blue]';
      default:
        return 'text-[#00ff4166]';
    }
  };

  return (
    <a
      href={auction.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-b border-[#00ff4133] p-4 hover:bg-[#252a28] transition-colors cursor-pointer"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="text-sm text-[#00ff41] font-mono font-semibold">
            {auction.manufacturer || 'Unknown'} {auction.model || 'Model'}
          </h4>
          {auction.caliber && (
            <div className="text-xs text-[#00ff4166] font-mono mt-0.5">
              {auction.caliber}
            </div>
          )}
        </div>
        {auction.lotNumber && (
          <div className="text-[10px] text-[#00ff4133] font-mono">
            LOT #{auction.lotNumber}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {auction.category && (
          <span className="tactical-badge-green">
            {auction.category}
          </span>
        )}
        {auction.condition && (
          <span className={`text-[10px] font-mono ${getConditionColor(auction.condition)}`}>
            {auction.condition}
          </span>
        )}
        {auction.rarity && (
          <span className={`text-[10px] font-mono ${getRarityColor(auction.rarity)}`}>
            {auction.rarity}
          </span>
        )}
        {auction.nfaItem && (
          <span className="tactical-badge-red">
            NFA
          </span>
        )}
        {auction.isEstateSale && (
          <span className="tactical-badge-amber">
            ESTATE
          </span>
        )}
      </div>

      {/* Pricing */}
      <div className="flex justify-between items-end">
        <div>
          {auction.currentBid && (
            <div className="text-sm text-[#00ff41] font-mono font-bold">
              ${auction.currentBid.toLocaleString()}
            </div>
          )}
          {auction.estimateLow && auction.estimateHigh && (
            <div className="text-[10px] text-[#00ff4166] font-mono">
              Est: ${auction.estimateLow.toLocaleString()} - ${auction.estimateHigh.toLocaleString()}
            </div>
          )}
        </div>
        {auction.auctionDate && (
          <div className="text-[10px] text-[#ffb000] font-mono">
            {formatDistanceToNow(new Date(auction.auctionDate), { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Auction house */}
      {auction.auctionHouse && (
        <div className="text-[10px] text-[#00ff4133] font-mono mt-2 uppercase">
          {auction.auctionHouse}
        </div>
      )}
    </a>
  );
}

export function LiveAuctionFeed() {
  const { data: auctions } = useQuery<FirearmAuction[]>({
    queryKey: ['live-auctions'],
    queryFn: async () => {
      const response = await fetch('/api/firearms/ending-soon');
      if (!response.ok) throw new Error('Failed to fetch auctions');
      const data = await response.json();
      return data.auctions;
    },
    refetchInterval: 30000 // 30 seconds
  });

  return (
    <div className="h-full tactical-border bg-[#1a1f1d] scanlines overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-[#00ff4133] px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse tactical-pulse" />
          <span className="hud-text text-sm uppercase tracking-wider">
            Live Feed - {auctions?.length || 0} Active
          </span>
        </div>
        <div className="text-xs text-[#00ff4166] font-mono">
          {new Date().toISOString().split('T')[0]}
        </div>
      </div>

      {/* Scrolling feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!auctions || auctions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[#00ff4166] font-mono text-sm">No active auctions</div>
              <div className="text-[#00ff4133] font-mono text-xs mt-2">
                System monitoring...
              </div>
            </div>
          </div>
        ) : (
          auctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))
        )}
      </div>

      {/* Footer stats */}
      {auctions && auctions.length > 0 && (
        <div className="h-10 border-t border-[#00ff4133] px-4 flex items-center justify-between flex-shrink-0 bg-[#252a28]">
          <div className="text-[10px] text-[#00ff4166] font-mono">
            TOTAL ACTIVE: {auctions.length}
          </div>
          <div className="text-[10px] text-[#00ff41] font-mono">
            LAST UPDATE: {formatDistanceToNow(new Date(), { addSuffix: true })}
          </div>
        </div>
      )}
    </div>
  );
}

