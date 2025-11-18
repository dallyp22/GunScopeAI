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
  const [viewMode, setViewMode] = useState<'auctions' | 'competitors'>('auctions');

  // Fetch auctions
  const { data: auctions } = useQuery<FirearmAuction[]>({
    queryKey: ['firearms-auctions-map'],
    queryFn: async () => {
      const response = await fetch('/api/firearms/auctions?limit=500');
      if (!response.ok) throw new Error('Failed to fetch auctions');
      const data = await response.json();
      return data.auctions.filter((a: FirearmAuction) => a.latitude && a.longitude);
    },
    refetchInterval: 60000,
    enabled: viewMode === 'auctions'
  });

  // Fetch competitor sources
  const { data: competitorSources } = useQuery<any[]>({
    queryKey: ['competitor-sources-map'],
    queryFn: async () => {
      const response = await fetch('/api/sources');
      if (!response.ok) throw new Error('Failed to fetch sources');
      const data = await response.json();
      return data.sources.filter((s: any) => s.category === 'competitor');
    },
    enabled: viewMode === 'competitors'
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

  // Add markers based on view mode
  useEffect(() => {
    if (!map.current) {
      console.log('Map not ready');
      return;
    }

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers based on view mode
    if (viewMode === 'auctions' && auctions) {
      console.log(`Adding ${auctions.length} auction markers`);
      
      auctions.forEach((auction) => {
        if (!auction.latitude || !auction.longitude) return;

        // Color by firearm category
        let color = '#9ca3af';
        if (auction.category === 'Handgun') color = '#00D4FF';
        else if (auction.category === 'Rifle') color = '#10B981';
        else if (auction.category === 'Shotgun') color = '#F59E0B';
        else if (auction.category === 'Machine Gun') color = '#EF4444';

        const el = document.createElement('div');
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        
        const handleClick = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
          setSelectedAuction(auction);
        };

        el.addEventListener('click', handleClick);
        el.addEventListener('touchend', handleClick);

        const marker = new maplibregl.Marker({ 
          element: el, 
          anchor: 'center',
          draggable: false
        })
          .setLngLat([auction.longitude, auction.latitude])
          .addTo(map.current!);
        
        markers.current.push(marker);
      });
    } else if (viewMode === 'competitors' && competitorSources) {
      console.log(`Adding ${competitorSources.length} competitor markers`);
      
      competitorSources.forEach((source: any) => {
        if (!source.latitude || !source.longitude) return;

        // Competitors use purple/magenta color
        const color = '#A855F7';

        const el = document.createElement('div');
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.border = '3px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 3px 10px rgba(0,0,0,0.4)';
        
        // Add popup on click
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          new maplibregl.Popup({ closeButton: true, closeOnClick: true })
            .setLngLat([source.longitude, source.latitude])
            .setHTML(`
              <div class="p-3">
                <div class="font-semibold text-sm mb-1">${source.name}</div>
                <div class="text-xs text-gray-600 mb-2">${source.city}, ${source.state}</div>
                <a href="${source.url}" target="_blank" class="text-xs text-blue-500 hover:underline">Visit Site →</a>
              </div>
            `)
            .addTo(map.current!);
        });

        const marker = new maplibregl.Marker({ 
          element: el, 
          anchor: 'center',
          draggable: false
        })
          .setLngLat([source.longitude, source.latitude])
          .addTo(map.current!);
        
        markers.current.push(marker);
      });
    }

    console.log(`Added ${markers.current.length} markers`);
  }, [auctions, competitorSources, viewMode]);

  return (
    <div className="h-full flex">
      {/* Map */}
      <div className={`${selectedAuction ? 'w-2/3' : 'w-full'} transition-all relative`}>
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* View Mode Toggle */}
        <div className="absolute top-4 left-4 segmented-control" style={{ width: '280px' }}>
          <button
            onClick={() => setViewMode('auctions')}
            className={`segmented-control-option ${viewMode === 'auctions' ? 'segmented-control-option-active' : ''}`}
          >
            Auctions ({auctions?.length || 0})
          </button>
          <button
            onClick={() => setViewMode('competitors')}
            className={`segmented-control-option ${viewMode === 'competitors' ? 'segmented-control-option-active' : ''}`}
          >
            Competitors ({competitorSources?.length || 0})
          </button>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 modern-card p-4">
          <div className="text-xs font-semibold text-white mb-3">
            {viewMode === 'auctions' ? 'Firearm Categories' : 'Competitor Locations'}
          </div>
          
          {viewMode === 'auctions' ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#00D4FF] border-2 border-white shadow-sm" />
                <span className="text-[#9CA3AF]">Handgun</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#10B981] border-2 border-white shadow-sm" />
                <span className="text-[#9CA3AF]">Rifle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#F59E0B] border-2 border-white shadow-sm" />
                <span className="text-[#9CA3AF]">Shotgun</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EF4444] border-2 border-white shadow-sm" />
                <span className="text-[#9CA3AF]">Machine Gun</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#A855F7] border-3 border-white shadow-sm" />
                <span className="text-[#9CA3AF]">Auction House</span>
              </div>
              <div className="text-xs text-[#6B7280] mt-2">
                Click marker for details
              </div>
            </div>
          )}
          
          <div className="text-xs text-[#6B7280] mt-3 pt-3 border-t border-[#374151]">
            {viewMode === 'auctions' 
              ? `${auctions?.length || 0} auctions mapped`
              : `${competitorSources?.length || 0} competitors mapped`}
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

