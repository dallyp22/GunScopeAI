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

    // Add new markers with CSS crosshair design
    auctions.forEach((auction) => {
      if (!auction.latitude || !auction.longitude) return;

      // Determine color by category
      let color = '#9ca3af';
      if (auction.category === 'Handgun') color = '#00D4FF';
      else if (auction.category === 'Rifle') color = '#10B981';
      else if (auction.category === 'Shotgun') color = '#F59E0B';
      else if (auction.category === 'Machine Gun') color = '#EF4444';

      // Create crosshair marker using CSS
      const el = document.createElement('div');
      el.className = 'crosshair-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.position = 'relative';
      el.style.cursor = 'pointer';
      
      // Outer ring
      const outerRing = document.createElement('div');
      outerRing.style.position = 'absolute';
      outerRing.style.width = '24px';
      outerRing.style.height = '24px';
      outerRing.style.borderRadius = '50%';
      outerRing.style.border = `2px solid ${color}`;
      outerRing.style.opacity = '0.4';
      outerRing.style.top = '4px';
      outerRing.style.left = '4px';
      
      // Inner dot
      const innerDot = document.createElement('div');
      innerDot.style.position = 'absolute';
      innerDot.style.width = '8px';
      innerDot.style.height = '8px';
      innerDot.style.borderRadius = '50%';
      innerDot.style.backgroundColor = color;
      innerDot.style.border = `1px solid ${color}`;
      innerDot.style.top = '12px';
      innerDot.style.left = '12px';
      
      // Vertical line top
      const vLineTop = document.createElement('div');
      vLineTop.style.position = 'absolute';
      vLineTop.style.width = '2px';
      vLineTop.style.height = '8px';
      vLineTop.style.backgroundColor = color;
      vLineTop.style.top = '0';
      vLineTop.style.left = '15px';
      
      // Vertical line bottom
      const vLineBottom = document.createElement('div');
      vLineBottom.style.position = 'absolute';
      vLineBottom.style.width = '2px';
      vLineBottom.style.height = '8px';
      vLineBottom.style.backgroundColor = color;
      vLineBottom.style.bottom = '0';
      vLineBottom.style.left = '15px';
      
      // Horizontal line left
      const hLineLeft = document.createElement('div');
      hLineLeft.style.position = 'absolute';
      hLineLeft.style.width = '8px';
      hLineLeft.style.height = '2px';
      hLineLeft.style.backgroundColor = color;
      hLineLeft.style.top = '15px';
      hLineLeft.style.left = '0';
      
      // Horizontal line right
      const hLineRight = document.createElement('div');
      hLineRight.style.position = 'absolute';
      hLineRight.style.width = '8px';
      hLineRight.style.height = '2px';
      hLineRight.style.backgroundColor = color;
      hLineRight.style.top = '15px';
      hLineRight.style.right = '0';
      
      // Assemble crosshair
      el.appendChild(outerRing);
      el.appendChild(innerDot);
      el.appendChild(vLineTop);
      el.appendChild(vLineBottom);
      el.appendChild(hLineLeft);
      el.appendChild(hLineRight);
      
      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.filter = `drop-shadow(0 0 6px ${color})`;
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.filter = 'none';
      });

      el.addEventListener('click', () => {
        setSelectedAuction(auction);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
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
        <div className="absolute bottom-4 left-4 modern-card p-4">
          <div className="text-xs font-semibold text-white mb-3">Categories</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 32 32" className="flex-shrink-0">
                <circle cx="16" cy="16" r="12" stroke="#00D4FF" strokeWidth="2" fill="none" opacity="0.4"/>
                <circle cx="16" cy="16" r="4" stroke="#00D4FF" strokeWidth="2" fill="#00D4FF" opacity="0.6"/>
                <line x1="16" y1="4" x2="16" y2="12" stroke="#00D4FF" strokeWidth="2"/>
                <line x1="16" y1="20" x2="16" y2="28" stroke="#00D4FF" strokeWidth="2"/>
                <line x1="4" y1="16" x2="12" y2="16" stroke="#00D4FF" strokeWidth="2"/>
                <line x1="20" y1="16" x2="28" y2="16" stroke="#00D4FF" strokeWidth="2"/>
              </svg>
              <span className="text-[#9CA3AF]">Handgun</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 32 32" className="flex-shrink-0">
                <circle cx="16" cy="16" r="12" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.4"/>
                <circle cx="16" cy="16" r="4" stroke="#10B981" strokeWidth="2" fill="#10B981" opacity="0.6"/>
                <line x1="16" y1="4" x2="16" y2="12" stroke="#10B981" strokeWidth="2"/>
                <line x1="16" y1="20" x2="16" y2="28" stroke="#10B981" strokeWidth="2"/>
                <line x1="4" y1="16" x2="12" y2="16" stroke="#10B981" strokeWidth="2"/>
                <line x1="20" y1="16" x2="28" y2="16" stroke="#10B981" strokeWidth="2"/>
              </svg>
              <span className="text-[#9CA3AF]">Rifle</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 32 32" className="flex-shrink-0">
                <circle cx="16" cy="16" r="12" stroke="#F59E0B" strokeWidth="2" fill="none" opacity="0.4"/>
                <circle cx="16" cy="16" r="4" stroke="#F59E0B" strokeWidth="2" fill="#F59E0B" opacity="0.6"/>
                <line x1="16" y1="4" x2="16" y2="12" stroke="#F59E0B" strokeWidth="2"/>
                <line x1="16" y1="20" x2="16" y2="28" stroke="#F59E0B" strokeWidth="2"/>
                <line x1="4" y1="16" x2="12" y2="16" stroke="#F59E0B" strokeWidth="2"/>
                <line x1="20" y1="16" x2="28" y2="16" stroke="#F59E0B" strokeWidth="2"/>
              </svg>
              <span className="text-[#9CA3AF]">Shotgun</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 32 32" className="flex-shrink-0">
                <circle cx="16" cy="16" r="12" stroke="#EF4444" strokeWidth="2" fill="none" opacity="0.4"/>
                <circle cx="16" cy="16" r="4" stroke="#EF4444" strokeWidth="2" fill="#EF4444" opacity="0.6"/>
                <line x1="16" y1="4" x2="16" y2="12" stroke="#EF4444" strokeWidth="2"/>
                <line x1="16" y1="20" x2="16" y2="28" stroke="#EF4444" strokeWidth="2"/>
                <line x1="4" y1="16" x2="12" y2="16" stroke="#EF4444" strokeWidth="2"/>
                <line x1="20" y1="16" x2="28" y2="16" stroke="#EF4444" strokeWidth="2"/>
              </svg>
              <span className="text-[#9CA3AF]">Machine Gun</span>
            </div>
          </div>
          <div className="text-xs text-[#6B7280] mt-3 pt-3 border-t border-[#374151]">
            {auctions?.length || 0} auctions mapped
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

