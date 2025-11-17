import { useQuery } from '@tanstack/react-query';

interface DashboardMetrics {
  activeAuctions: number;
  endingSoon: number;
  opportunities: number;
  avgDeviation: number;
  estateSales: number;
  enrichment: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
  };
}

interface MetricProps {
  label: string;
  value: number | string;
  trend?: number;
  alert?: boolean;
  highlight?: boolean;
  icon: string;
}

function Metric({ label, value, trend, alert, highlight, icon }: MetricProps) {
  const valueColor = alert 
    ? 'text-[#ff0000]' 
    : highlight 
    ? 'text-[#ffb000]'
    : 'text-[#00ff41]';

  const glowColor = alert
    ? 'shadow-[0_0_8px_rgba(255,0,0,0.6)]'
    : highlight
    ? 'shadow-[0_0_8px_rgba(255,176,0,0.6)]'
    : 'shadow-[0_0_8px_rgba(0,255,65,0.6)]';

  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl opacity-70">{icon}</div>
      <div>
        <div className="text-[10px] text-[#00ff4166] uppercase tracking-wider font-mono">
          {label}
        </div>
        <div className={`text-2xl font-mono font-bold ${valueColor} ${glowColor}`}>
          {value}
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`text-xs font-mono ${trend > 0 ? 'text-[#00ff41]' : 'text-[#ff0000]'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

export function MetricsDashboard() {
  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/dashboard');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      return data.metrics;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[#00ff4166] font-mono text-sm">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-around px-4">
      <Metric
        label="Active Auctions"
        value={metrics.activeAuctions}
        icon="🎯"
      />
      
      <div className="w-px h-8 bg-[#00ff4133]" />
      
      <Metric
        label="Ending Soon"
        value={metrics.endingSoon}
        alert={metrics.endingSoon > 10}
        icon="⏰"
      />
      
      <div className="w-px h-8 bg-[#00ff4133]" />
      
      <Metric
        label="Opportunities"
        value={metrics.opportunities}
        highlight={true}
        icon="💎"
      />
      
      <div className="w-px h-8 bg-[#00ff4133]" />
      
      <Metric
        label="Avg Deviation"
        value={`${metrics.avgDeviation.toFixed(1)}%`}
        icon="📊"
      />
      
      <div className="w-px h-8 bg-[#00ff4133]" />
      
      <Metric
        label="Estate Sales"
        value={metrics.estateSales}
        icon="🏚️"
      />
      
      <div className="w-px h-8 bg-[#00ff4133]" />
      
      <Metric
        label="Enrichment"
        value={`${((metrics.enrichment.completed / metrics.enrichment.total) * 100).toFixed(0)}%`}
        icon="🤖"
      />
    </div>
  );
}

