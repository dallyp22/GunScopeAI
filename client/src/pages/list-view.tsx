import { TacticalNav } from '@/components/TacticalNav';
import { AuctionsList } from '@/components/AuctionsList';

export default function ListView() {
  return (
    <div className="h-screen bg-[#0a0f0d] flex flex-col">
      <TacticalNav />
      <div className="flex-1 p-1">
        <AuctionsList />
      </div>
    </div>
  );
}

