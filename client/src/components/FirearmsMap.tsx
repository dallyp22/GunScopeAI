import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from '@tanstack/react-query';
import { FirearmAuctionDetail } from './FirearmAuctionDetail';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_KEY || '';

interface FirearmAuction {
  id: number;
  manufacturer: string | null;
  model: string | null;
  caliber: string | null;
  category: string | null;
  currentBid: number | null;
  latitude: number | null;
  longitude: number | null;
  auctionHouse: string | null;
  state: string | null;
  url: string;
  nfaItem: boolean;
  isEstateSale: boolean;
}

export function FirearmsMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<FirearmAuction | null>(null);

  const { data: auctions } = useQuery<FirearmAuction[]>({
    queryKey: ['firearms-auctions-map'],
    queryFn: async () => {
      const response = await fetch('/api/firearms/auctions?limit=500');
      if (!response.ok) throw new Error('Failed to fetch auctions');
      const data = await response.json();
      return data.auctions.filter((a: FirearmAuction) => a.latitude && a.longitude);
    },
    refetchInterval: 60000
  });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with Mapbox style
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [-98.5, 39.8], // Center of US
      zoom: 4
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    console.log('Map initialized');
  }, []);

  // Add markers when auctions load
  useEffect(() => {
    if (!map.current || !auctions) {
      console.log('Map or auctions not ready', { map: !!map.current, auctions: !!auctions });
      return;
    }

    console.log(`Adding ${auctions.length} markers to map`);

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    auctions.forEach((auction) => {
      if (!auction.latitude || !auction.longitude) return;

      const el = document.createElement('div');
      el.className = 'firearm-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid #00ff41';
      el.style.boxShadow = '0 0 10px rgba(0, 255, 65, 0.6)';
      
      // Color by category
      if (auction.category === 'Handgun') {
        el.style.backgroundColor = '#00d4ff';
      } else if (auction.category === 'Rifle') {
        el.style.backgroundColor = '#00ff41';
      } else if (auction.category === 'Shotgun') {
        el.style.backgroundColor = '#ffb000';
      } else if (auction.category === 'Machine Gun') {
        el.style.backgroundColor = '#ff0000';
      } else {
        el.style.backgroundColor = '#9ca3af';
      }

      el.addEventListener('click', () => {
        setSelectedAuction(auction);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([auction.longitude, auction.latitude])
        .addTo(map.current!);
      
      markers.current.push(marker);
    });

    console.log(`Added ${markers.current.length} markers`);
  }, [auctions]);

  return (
    <div className="h-full flex">
      {/* Map */}
      <div className={`${selectedAuction ? 'w-2/3' : 'w-full'} transition-all relative`}>
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 tactical-border bg-[#1a1f1d] p-3 scanlines">
          <div className="text-xs text-[#00ff41] font-mono uppercase mb-2">Categories</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#00d4ff', border: '1px solid #00ff41'}} />
              <span className="text-[#00ff4166]">Handgun</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#00ff41', border: '1px solid #00ff41'}} />
              <span className="text-[#00ff4166]">Rifle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ffb000', border: '1px solid #00ff41'}} />
              <span className="text-[#00ff4166]">Shotgun</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ff0000', border: '1px solid #00ff41'}} />
              <span className="text-[#00ff4166]">Machine Gun</span>
            </div>
          </div>
          <div className="text-[10px] text-[#00ff4133] font-mono mt-2">
            {auctions?.length || 0} AUCTIONS MAPPED
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

