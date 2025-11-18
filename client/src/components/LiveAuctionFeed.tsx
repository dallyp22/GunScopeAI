import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

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
        return 'text-[#10B981]';
      case 'Very Good':
      case 'Good':
        return 'text-[#F59E0B]';
      default:
        return 'text-[#6B7280]';
    }
  };

  return (
    <a
      href={auction.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg bg-[#242832] border border-[#2a3040] hover:border-[#00D4FF] transition-all smooth-hover"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white mb-1 line-height-snug">
            {auction.manufacturer || 'Unknown'} {auction.model || 'Model'}
          </h4>
          {auction.caliber && (
            <div className="text-xs text-[#9CA3AF]">
              {auction.caliber}
            </div>
          )}
        </div>
        {auction.lotNumber && (
          <div className="text-xs text-[#6B7280] ml-2">
            #{auction.lotNumber}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {auction.category && (
          <span className="badge-primary text-xs">
            {auction.category}
          </span>
        )}
        {auction.condition && (
          <span className={`text-xs font-medium ${getConditionColor(auction.condition)}`}>
            {auction.condition}
          </span>
        )}
        {auction.nfaItem && (
          <span className="badge-danger text-xs">
            NFA
          </span>
        )}
        {auction.isEstateSale && (
          <span className="badge-warning text-xs">
            Estate
          </span>
        )}
      </div>

      {/* Pricing */}
      <div className="mb-3">
        {auction.currentBid && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#9CA3AF]">Current Bid</span>
            <span className="text-base text-[#10B981] font-semibold data-value">
              ${auction.currentBid.toLocaleString()}
            </span>
          </div>
        )}
        {auction.estimateLow && auction.estimateHigh && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-[#9CA3AF]">Estimate</span>
            <span className="text-xs text-[#6B7280] data-value">
              ${auction.estimateLow.toLocaleString()} - ${auction.estimateHigh.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#6B7280]">
          {auction.auctionHouse || 'Unknown'}
        </span>
        {auction.auctionDate && (
          <span className="text-[#F59E0B] font-medium">
            {formatDistanceToNow(new Date(auction.auctionDate), { addSuffix: true })}
          </span>
        )}
      </div>
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
    refetchInterval: 30000
  });

  return (
    <div className="modern-card h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#10B981] rounded-full subtle-pulse" />
          <h3 className="text-sm font-semibold text-white">
            Live Feed
          </h3>
        </div>
        <div className="text-xs text-[#00D4FF] font-medium">
          {auctions?.length || 0} active
        </div>
      </div>

      {/* Auction Cards */}
      <div className="flex-1 overflow-auto modern-scrollbar space-y-3">
        {!auctions || auctions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[#6B7280] text-sm mb-2">No active auctions</div>
              <div className="text-[#6B7280] text-xs">
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

      {/* Footer Stats */}
      {auctions && auctions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#374151]">
          <div className="flex justify-between text-xs">
            <span className="text-[#9CA3AF]">Total Active</span>
            <span className="text-white font-medium">{auctions.length}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-[#9CA3AF]">Last Update</span>
            <span className="text-[#00D4FF] font-medium">
              {formatDistanceToNow(new Date(), { addSuffix: true })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
