import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

interface PriceTrend {
  date: string;
  avgPrice: number;
  volume: number;
}

export function PriceCharts() {
  const [timeRange, setTimeRange] = useState<number>(30);

  const { data: priceData } = useQuery<PriceTrend[]>({
    queryKey: ['price-trends', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/intelligence/pricing/Handgun?days=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch price trends');
      const data = await response.json();
      return data.trends;
    },
    refetchInterval: 300000
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="frosted-glass border border-[#374151] p-3 rounded-lg">
          <div className="text-xs text-[#9CA3AF] mb-1">
            {new Date(payload[0].payload.date).toLocaleDateString()}
          </div>
          <div className="text-sm text-white font-semibold">
            ${payload[0].value.toLocaleString()}
          </div>
          <div className="text-xs text-[#6B7280] mt-1">
            Volume: {payload[0].payload.volume}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="modern-card h-full flex flex-col p-5">
      {/* Header with Time Range Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Price Trends
        </h3>
        
        {/* Time Range Pills */}
        <div className="flex gap-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                timeRange === days
                  ? 'bg-[#00D4FF] text-white'
                  : 'bg-[#2a3040] text-[#9CA3AF] hover:bg-[#374151]'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>
      
      {!priceData || priceData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#6B7280] text-sm">
            Insufficient data
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="avgPrice"
                stroke="#00D4FF"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#00D4FF', stroke: '#1a1d23', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      {priceData && priceData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-[#2a3040]">
            <div className="text-xs text-[#9CA3AF] mb-1">Avg Price</div>
            <div className="text-lg text-white font-semibold data-value">
              ${(priceData.reduce((sum, d) => sum + d.avgPrice, 0) / priceData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#2a3040]">
            <div className="text-xs text-[#9CA3AF] mb-1">Total Volume</div>
            <div className="text-lg text-white font-semibold data-value">
              {priceData.reduce((sum, d) => sum + d.volume, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
