import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { FirearmAuctionDetail } from './FirearmAuctionDetail';

interface FirearmAuction {
  id: number;
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
  state: string | null;
  city: string | null;
  url: string;
  nfaItem: boolean;
  isEstateSale: boolean;
}

export function AuctionsList() {
  const [selectedAuction, setSelectedAuction] = useState<FirearmAuction | null>(null);
  const [sortBy, setSortBy] = useState<string>('auctionDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { data: auctions, isLoading } = useQuery<FirearmAuction[]>({
    queryKey: ['firearms-list'],
    queryFn: async () => {
      const response = await fetch('/api/firearms/auctions?limit=100');
      if (!response.ok) throw new Error('Failed to fetch auctions');
      const data = await response.json();
      return data.auctions;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const sortedAuctions = auctions ? [...auctions].sort((a, b) => {
    let aVal: any = a[sortBy as keyof FirearmAuction];
    let bVal: any = b[sortBy as keyof FirearmAuction];
    
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    
    if (sortDir === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  }) : [];

  return (
    <div className="h-full flex">
      {/* Table */}
      <div className={`${selectedAuction ? 'w-2/3' : 'w-full'} transition-all`}>
        <div className="tactical-border bg-[#1a1f1d] scanlines h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-[#00ff4133] p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
              <h3 className="hud-text text-sm uppercase tracking-wider">
                All Firearms Auctions
              </h3>
            </div>
            <div className="text-xs text-[#00ff4166] font-mono">
              {auctions?.length || 0} TOTAL
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#00ff4166] font-mono text-sm">Loading...</div>
              </div>
            ) : (
              <table className="tactical-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('manufacturer')} className="cursor-pointer hover:text-[#00ff41]">
                      MFG {sortBy === 'manufacturer' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('model')} className="cursor-pointer hover:text-[#00ff41]">
                      MODEL {sortBy === 'model' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('caliber')} className="cursor-pointer hover:text-[#00ff41]">
                      CALIBER {sortBy === 'caliber' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('condition')} className="cursor-pointer hover:text-[#00ff41]">
                      COND {sortBy === 'condition' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('currentBid')} className="cursor-pointer hover:text-[#00ff41]">
                      BID {sortBy === 'currentBid' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('auctionHouse')} className="cursor-pointer hover:text-[#00ff41]">
                      HOUSE {sortBy === 'auctionHouse' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('state')} className="cursor-pointer hover:text-[#00ff41]">
                      STATE {sortBy === 'state' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('auctionDate')} className="cursor-pointer hover:text-[#00ff41]">
                      DATE {sortBy === 'auctionDate' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAuctions.map((auction) => (
                    <tr 
                      key={auction.id}
                      onClick={() => setSelectedAuction(auction)}
                      className="cursor-pointer"
                    >
                      <td>{auction.manufacturer || '-'}</td>
                      <td>{auction.model || '-'}</td>
                      <td className="text-[#ffb000]">{auction.caliber || '-'}</td>
                      <td>{auction.condition || '-'}</td>
                      <td className="text-[#00ff41] font-bold">
                        {auction.currentBid ? `$${auction.currentBid.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-xs">{auction.auctionHouse || '-'}</td>
                      <td>{auction.state || '-'}</td>
                      <td className="text-xs">
                        {auction.auctionDate ? formatDistanceToNow(new Date(auction.auctionDate), { addSuffix: true }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedAuction && (
        <div className="w-1/3 ml-1">
          <FirearmAuctionDetail 
            auction={selectedAuction} 
            onClose={() => setSelectedAuction(null)}
          />
        </div>
      )}
    </div>
  );
}

