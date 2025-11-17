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

interface MetricCardProps {
  label: string;
  value: number | string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  contextInfo?: string;
}

function MetricCard({ label, value, change, changeType = 'neutral', contextInfo }: MetricCardProps) {
  const changeColor = changeType === 'positive' 
    ? 'text-[#10B981]' 
    : changeType === 'negative'
    ? 'text-[#EF4444]'
    : 'text-[#6B7280]';

  return (
    <div className="metric-card">
      <div className="text-sm text-[#9CA3AF] mb-1">{label}</div>
      <div className="text-3xl font-semibold text-white mb-1 data-value">{value}</div>
      {change && (
        <div className={`text-xs font-medium ${changeColor}`}>
          {change}
        </div>
      )}
      {contextInfo && (
        <div className="text-xs text-[#6B7280] mt-1">
          {contextInfo}
        </div>
      )}
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
      <div className="grid grid-cols-4 gap-4 p-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="metric-card shimmer h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      <MetricCard
        label="Active Auctions"
        value={metrics.activeAuctions}
        change="↑ 2 from yesterday"
        changeType="positive"
      />
      
      <MetricCard
        label="Ending Soon"
        value={metrics.endingSoon}
        contextInfo={metrics.endingSoon > 0 ? `Next in 1h 23m` : 'None in 24h'}
      />
      
      <MetricCard
        label="Opportunities"
        value={metrics.opportunities}
        change={metrics.opportunities > 0 ? `${metrics.opportunities} below market` : 'None detected'}
        changeType={metrics.opportunities > 0 ? 'positive' : 'neutral'}
      />
      
      <MetricCard
        label="Avg Deviation"
        value={`${metrics.avgDeviation.toFixed(1)}%`}
        contextInfo="From market average"
      />
    </div>
  );
}
