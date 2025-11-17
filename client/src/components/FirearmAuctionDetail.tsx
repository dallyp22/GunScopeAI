import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface FirearmAuctionDetailProps {
  auction: any;
  onClose?: () => void;
}

export function FirearmAuctionDetail({ auction, onClose }: FirearmAuctionDetailProps) {
  return (
    <div className="h-full tactical-border bg-[#1a1f1d] scanlines overflow-y-auto">
      {/* Header with close button */}
      <div className="p-4 border-b border-[#00ff4133] flex justify-between items-start">
        <div className="flex-1">
          <h2 className="hud-text-bright text-lg mb-1">
            {auction.manufacturer} {auction.model}
          </h2>
          {auction.caliber && (
            <div className="text-sm text-[#00ff4166] font-mono">
              {auction.caliber}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#00ff4166] hover:text-[#00ff41] transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Countdown/Status */}
      {auction.auctionDate && (
        <div className="p-4 bg-[#252a28] border-b border-[#00ff4133]">
          <div className="text-xs text-[#00ff4166] font-mono mb-1">AUCTION ENDS</div>
          <div className="text-lg text-[#ffb000] font-mono font-bold">
            {new Date(auction.auctionDate).toLocaleString()}
          </div>
        </div>
      )}

      {/* Tabs: Details | Analysis | History */}
      <Tabs defaultValue="details" className="flex-1">
        <TabsList className="tactical-tabs w-full justify-start border-b border-[#00ff4133] rounded-none">
          <TabsTrigger value="details" className="tactical-tab">Details</TabsTrigger>
          <TabsTrigger value="analysis" className="tactical-tab">Analysis</TabsTrigger>
          <TabsTrigger value="history" className="tactical-tab">Price History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="p-4 space-y-4">
          {/* Identification */}
          <div>
            <h3 className="text-xs text-[#00ff4166] font-mono uppercase mb-2">Identification</h3>
            <div className="space-y-2 text-sm font-mono">
              {auction.manufacturer && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Manufacturer:</span>
                  <span className="text-[#00ff41]">{auction.manufacturer}</span>
                </div>
              )}
              {auction.model && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Model:</span>
                  <span className="text-[#00ff41]">{auction.model}</span>
                </div>
              )}
              {auction.caliber && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Caliber:</span>
                  <span className="text-[#00ff41]">{auction.caliber}</span>
                </div>
              )}
              {auction.serialNumber && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Serial:</span>
                  <span className="text-[#00ff41]">{auction.serialNumber}</span>
                </div>
              )}
              {auction.yearManufactured && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Year:</span>
                  <span className="text-[#00ff41]">{auction.yearManufactured}</span>
                </div>
              )}
            </div>
          </div>

          {/* Condition */}
          {auction.condition && (
            <div className="border-t border-[#00ff4133] pt-4">
              <h3 className="text-xs text-[#00ff4166] font-mono uppercase mb-2">Condition</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Grade:</span>
                  <span className="text-[#00ff41]">{auction.condition}</span>
                </div>
                {auction.boreCondition && (
                  <div className="flex justify-between">
                    <span className="text-[#00ff4166]">Bore:</span>
                    <span className="text-[#00ff41]">{auction.boreCondition}</span>
                  </div>
                )}
                {auction.finishPercentage && (
                  <div className="flex justify-between">
                    <span className="text-[#00ff4166]">Finish:</span>
                    <span className="text-[#00ff41]">{auction.finishPercentage}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auction Info */}
          <div className="border-t border-[#00ff4133] pt-4">
            <h3 className="text-xs text-[#00ff4166] font-mono uppercase mb-2">Auction Info</h3>
            <div className="space-y-2 text-sm font-mono">
              {auction.auctionHouse && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">House:</span>
                  <span className="text-[#00ff41]">{auction.auctionHouse}</span>
                </div>
              )}
              {auction.lotNumber && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Lot #:</span>
                  <span className="text-[#00ff41]">{auction.lotNumber}</span>
                </div>
              )}
              {auction.currentBid && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Current Bid:</span>
                  <span className="text-[#00ff41] font-bold">${auction.currentBid.toLocaleString()}</span>
                </div>
              )}
              {auction.estimateLow && auction.estimateHigh && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Estimate:</span>
                  <span className="text-[#ffb000]">
                    ${auction.estimateLow.toLocaleString()} - ${auction.estimateHigh.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Legal/Transfer */}
          {(auction.transferType || auction.nfaItem) && (
            <div className="border-t border-[#00ff4133] pt-4">
              <h3 className="text-xs text-[#00ff4166] font-mono uppercase mb-2">Legal/Transfer</h3>
              <div className="space-y-2 text-sm font-mono">
                {auction.transferType && (
                  <div className="flex justify-between">
                    <span className="text-[#00ff4166]">Transfer Type:</span>
                    <span className="text-[#00ff41]">{auction.transferType}</span>
                  </div>
                )}
                {auction.nfaItem && (
                  <div className="flex justify-between">
                    <span className="text-[#00ff4166]">NFA Item:</span>
                    <span className="text-[#ff0000] font-bold">YES - TAX STAMP REQUIRED</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="p-4 space-y-4">
          {/* Value Assessment */}
          <div>
            <h3 className="text-xs text-[#00ff4166] font-mono uppercase mb-2">Value Assessment</h3>
            <div className="space-y-2 text-sm font-mono">
              {auction.rarity && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Rarity:</span>
                  <span className="text-[#ffb000]">{auction.rarity}</span>
                </div>
              )}
              {auction.desirability && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Desirability:</span>
                  <span className="text-[#00ff41]">{auction.desirability}/10</span>
                </div>
              )}
              {auction.investmentGrade !== null && (
                <div className="flex justify-between">
                  <span className="text-[#00ff4166]">Investment Grade:</span>
                  <span className={auction.investmentGrade ? "text-[#00ff41]" : "text-[#ff0000]"}>
                    {auction.investmentGrade ? 'YES' : 'NO'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Provenance */}
          {auction.provenance && (
            <div className="border-t border-[#00ff4133] pt-4">
              <h3 className="text-xs text-[#00ff4166] font-mono uppercase mb-2">Provenance</h3>
              <div className="text-sm text-[#00ff41] font-mono">
                {auction.provenance}
              </div>
            </div>
          )}

          {/* Included Accessories */}
          {auction.includedAccessories && auction.includedAccessories.length > 0 && (
            <div className="border-t border-[#00ff4133] pt-4">
              <h3 className="text-xs text-[#00ff4166] font-mono uppercase mb-2">Included Items</h3>
              <ul className="space-y-1">
                {auction.includedAccessories.map((item: string, idx: number) => (
                  <li key={idx} className="text-sm text-[#00ff41] font-mono flex items-start">
                    <span className="text-[#00ff4166] mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* Price History Tab */}
        <TabsContent value="history" className="p-4">
          <div className="text-center py-8">
            <div className="text-[#00ff4166] font-mono text-xs">
              Price history analysis
            </div>
            <div className="text-[#00ff4133] font-mono text-[10px] mt-2">
              Building historical database...
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="p-4 border-t border-[#00ff4133] bg-[#252a28]">
        <a
          href={auction.url}
          target="_blank"
          rel="noopener noreferrer"
          className="tactical-btn w-full text-center block py-3"
        >
          VIEW ON {auction.auctionHouse || 'AUCTION SITE'}
        </a>
      </div>
    </div>
  );
}

