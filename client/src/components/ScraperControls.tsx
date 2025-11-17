import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ScrapeProgress {
  isActive: boolean;
  currentSource: string;
  completedSources: number;
  totalSources: number;
  currentSourceProgress: number;
}

export function ScraperControls() {
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const { toast } = useToast();

  // Get scrape progress
  const { data: progress } = useQuery<ScrapeProgress>({
    queryKey: ['scrape-progress'],
    queryFn: async () => {
      const response = await fetch('/api/firearms/scrape-progress');
      if (!response.ok) throw new Error('Failed to fetch progress');
      const data = await response.json();
      return data.progress;
    },
    refetchInterval: isScrapingInProgress ? 2000 : false, // Poll every 2s while scraping
    enabled: isScrapingInProgress
  });

  // Trigger scraping
  const scrapeMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting scrape mutation...');
      const response = await fetch('/api/firearms/refresh', { method: 'POST' });
      console.log('Scrape response:', response.status);
      if (!response.ok) throw new Error('Failed to start scraping');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Scrape started successfully:', data);
      setIsScrapingInProgress(true);
      toast({
        title: "Scraping Started",
        description: "Scraping all 35 auction sources in background",
      });
      // Stop polling after 10 minutes
      setTimeout(() => setIsScrapingInProgress(false), 600000);
    },
    onError: (error) => {
      console.error('Scrape error:', error);
      toast({
        title: "Scraping Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Trigger enrichment
  const enrichMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting enrichment mutation...');
      const response = await fetch('/api/firearms/enrich-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });
      console.log('Enrichment response:', response.status);
      if (!response.ok) throw new Error('Failed to start enrichment');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Enrichment started:', data);
      toast({
        title: "Enrichment Started",
        description: data.message || "Processing auctions with AI",
      });
    },
    onError: (error) => {
      console.error('Enrichment error:', error);
      toast({
        title: "Enrichment Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="tactical-border bg-[#1a1f1d] scanlines p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${progress?.isActive ? 'bg-[#ffb000] animate-pulse' : 'bg-[#00ff4166]'}`} />
        <h3 className="text-[#00ff41] text-sm uppercase tracking-wider font-mono">
          Scraper Controls
        </h3>
      </div>

      {/* Scrape Button */}
      <button
        onClick={() => {
          console.log('Scraper button clicked');
          scrapeMutation.mutate();
        }}
        disabled={scrapeMutation.isPending || progress?.isActive}
        className="w-full tactical-btn mb-3"
      >
        {scrapeMutation.isPending || progress?.isActive ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
            SCRAPING...
          </span>
        ) : (
          '🔫 RUN SCRAPER'
        )}
      </button>

      {/* Progress Display */}
      {progress?.isActive && (
        <div className="mb-3 p-3 border border-[#ffb00033] bg-[#252a28]">
          <div className="text-xs text-[#ffb000] font-mono mb-2">
            {progress.currentSource || 'Initializing...'}
          </div>
          <div className="h-2 bg-[#00ff4133] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ffb000] transition-all duration-300"
              style={{ 
                width: `${(progress.completedSources / progress.totalSources) * 100}%` 
              }}
            />
          </div>
          <div className="text-[10px] text-[#00ff4166] font-mono mt-1">
            {progress.completedSources} / {progress.totalSources} sources
          </div>
        </div>
      )}

      {/* Enrich Button */}
      <button
        onClick={() => {
          console.log('Enrich button clicked');
          enrichMutation.mutate();
        }}
        disabled={enrichMutation.isPending}
        className="w-full tactical-btn mb-3"
      >
        {enrichMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
            ENRICHING...
          </span>
        ) : (
          '🤖 ENRICH ALL'
        )}
      </button>

      {/* Stats */}
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between border-b border-[#00ff4133] pb-1">
          <span className="text-[#00ff4166]">Last Scrape:</span>
          <span className="text-[#00ff41]">Never</span>
        </div>
        <div className="flex justify-between border-b border-[#00ff4133] pb-1">
          <span className="text-[#00ff4166]">Total Sources:</span>
          <span className="text-[#00ff41]">35</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#00ff4166]">Status:</span>
          <span className={progress?.isActive ? "text-[#ffb000]" : "text-[#00ff41]"}>
            {progress?.isActive ? 'ACTIVE' : 'READY'}
          </span>
        </div>
      </div>
    </div>
  );
}

