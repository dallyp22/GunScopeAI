import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PriceTrend {
  date: string;
  avgPrice: number;
  volume: number;
}

export function PriceCharts() {
  const { data: priceData } = useQuery<PriceTrend[]>({
    queryKey: ['price-trends'],
    queryFn: async () => {
      const response = await fetch('/api/intelligence/pricing/Handgun?days=30');
      if (!response.ok) throw new Error('Failed to fetch price trends');
      const data = await response.json();
      return data.trends;
    },
    refetchInterval: 300000 // 5 minutes
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1f1d] border border-[#00ff4133] p-2 font-mono">
          <div className="text-xs text-[#00ff4166]">{payload[0].payload.date}</div>
          <div className="text-sm text-[#00ff41]">
            ${payload[0].value.toLocaleString()}
          </div>
          <div className="text-xs text-[#00ff4166]">
            Vol: {payload[0].payload.volume}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tactical-border bg-[#1a1f1d] p-4 scanlines">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-[#00ff41] rounded-full" />
        <h3 className="hud-text text-sm uppercase tracking-wider">
          Price Trends - 30D
        </h3>
      </div>
      
      {!priceData || priceData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="text-[#00ff4166] font-mono text-xs">
            Insufficient data
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="#00ff4166"
              tick={{ fill: '#00ff41', fontSize: 10, fontFamily: 'Roboto Mono' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="#00ff4166"
              tick={{ fill: '#00ff41', fontSize: 10, fontFamily: 'Roboto Mono' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="avgPrice" 
              stroke="#00ff41" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00ff41', stroke: '#0a0f0d', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Summary stats */}
      {priceData && priceData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="border border-[#00ff4133] p-2">
            <div className="text-[10px] text-[#00ff4166] font-mono">AVG PRICE</div>
            <div className="text-sm text-[#00ff41] font-mono font-bold">
              ${(priceData.reduce((sum, d) => sum + d.avgPrice, 0) / priceData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="border border-[#00ff4133] p-2">
            <div className="text-[10px] text-[#00ff4166] font-mono">TOTAL VOL</div>
            <div className="text-sm text-[#00ff41] font-mono font-bold">
              {priceData.reduce((sum, d) => sum + d.volume, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

