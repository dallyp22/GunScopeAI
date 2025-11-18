import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScrapeProgress {
  isActive: boolean;
  currentSource: string;
  completedSources: number;
  totalSources: number;
  currentSourceProgress: number;
}

export function ScraperControls() {
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [sourceCategory, setSourceCategory] = useState<'estate' | 'competitor'>('estate');
  const { toast } = useToast();

  const { data: progress } = useQuery<ScrapeProgress>({
    queryKey: ['scrape-progress'],
    queryFn: async () => {
      const response = await fetch('/api/firearms/scrape-progress');
      if (!response.ok) throw new Error('Failed to fetch progress');
      const data = await response.json();
      return data.progress;
    },
    refetchInterval: isScrapingInProgress ? 2000 : false,
    enabled: isScrapingInProgress
  });

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/firearms/refresh', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to start scraping');
      return response.json();
    },
    onSuccess: (data) => {
      setIsScrapingInProgress(true);
      toast({
        title: "Scraping Started",
        description: "Scraping all auction sources in background",
      });
      setTimeout(() => setIsScrapingInProgress(false), 600000);
    },
    onError: (error) => {
      toast({
        title: "Scraping Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const enrichMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/firearms/enrich-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });
      if (!response.ok) throw new Error('Failed to start enrichment');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Enrichment Started",
        description: data.message || "Processing auctions with AI",
      });
    }
  });

  return (
    <div className="modern-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${progress?.isActive ? 'bg-[#F59E0B] subtle-pulse' : 'bg-[#10B981]'}`} />
        <h3 className="text-sm font-semibold text-white">
          Scraper Controls
        </h3>
      </div>

      {/* Category Segmented Control */}
      <div className="segmented-control mb-4">
        <button
          onClick={() => setSourceCategory('estate')}
          className={`segmented-control-option ${sourceCategory === 'estate' ? 'segmented-control-option-active' : ''}`}
        >
          Estate
        </button>
        <button
          onClick={() => setSourceCategory('competitor')}
          className={`segmented-control-option ${sourceCategory === 'competitor' ? 'segmented-control-option-active' : ''}`}
        >
          Competitors
        </button>
      </div>

      {/* Action Buttons */}
      <button
        onClick={() => scrapeMutation.mutate()}
        disabled={scrapeMutation.isPending || progress?.isActive}
        className="w-full modern-btn mb-3"
      >
        {scrapeMutation.isPending || progress?.isActive ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Scraping...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <img src="/gunscope-logo.png" alt="" className="h-4 w-4" />
            Run Scraper
          </span>
        )}
      </button>

      {/* Progress Bar */}
      {progress?.isActive && (
        <div className="mb-4 p-3 rounded-lg bg-[#2a3040] border border-[#374151]">
          <div className="text-xs text-[#9CA3AF] mb-2">
            {progress.currentSource || 'Initializing...'}
          </div>
          <div className="modern-progress-bar">
            <div 
              className="modern-progress-fill"
              style={{ width: `${(progress.completedSources / progress.totalSources) * 100}%` }}
            />
          </div>
          <div className="text-xs text-[#6B7280] mt-2">
            {progress.completedSources} / {progress.totalSources} sources
          </div>
        </div>
      )}

      <button
        onClick={() => enrichMutation.mutate()}
        disabled={enrichMutation.isPending}
        className="w-full modern-btn mb-4"
        style={{ background: '#10B981' }}
      >
        {enrichMutation.isPending ? 'Enriching...' : 'Enrich All'}
      </button>

      {/* Stats with Tooltips */}
      <TooltipProvider>
        <div className="space-y-3 text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-between items-center cursor-help">
                <span className="text-[#9CA3AF]">Category</span>
                <span className="text-white font-medium">
                  {sourceCategory === 'estate' ? 'Estate Auctions' : 'Competitors'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="frosted-glass border border-[#374151] text-white">
              <p>Toggle between estate sale sites and competitor marketplaces</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-between items-center cursor-help">
                <span className="text-[#9CA3AF]">Sources</span>
                <span className="text-white font-medium data-value">
                  {sourceCategory === 'estate' ? '36' : '10'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="frosted-glass border border-[#374151] text-white">
              <p>Number of configured auction sources for this category</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-between items-center cursor-help">
                <span className="text-[#9CA3AF]">Last Scrape</span>
                <span className="text-white font-medium">Never</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="frosted-glass border border-[#374151] text-white">
              <p>Time since last successful scrape run</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-between items-center cursor-help">
                <span className="text-[#9CA3AF]">Status</span>
                <span className={`font-medium ${progress?.isActive ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                  {progress?.isActive ? 'Scraping' : 'Ready'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="frosted-glass border border-[#374151] text-white">
              <p>Current scraper operation status</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Info Box */}
      {sourceCategory === 'competitor' && (
        <div className="mt-4 p-3 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)]">
          <div className="text-xs text-[#00D4FF] font-medium">
            10 major marketplaces configured
          </div>
          <div className="text-xs text-[#6B7280] mt-1">
            GunBroker, GunsAmerica, GunSpot +7 more
          </div>
        </div>
      )}
    </div>
  );
}
