import { TacticalNav } from '@/components/TacticalNav';
import { FirearmsMap } from '@/components/FirearmsMap';

export default function MapView() {
  return (
    <div className="h-screen bg-[#0a0f0d] flex flex-col">
      <TacticalNav />
      <div className="flex-1">
        <FirearmsMap />
      </div>
    </div>
  );
}

