import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import type { StockMap } from '../types';

interface AllocationProps {
  holdings: Record<string, number>;
  prices: StockMap;
}

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function PortfolioAllocationChart({ holdings, prices }: AllocationProps) {
  const data = Object.entries(holdings)
    .map(([ticker, shares]) => {
      const price = prices[ticker]?.price || 0;
      const value = shares * price;
      return { name: ticker, value: parseFloat(value.toFixed(2)) };
    })
    .filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-500">
        No holdings to display allocation.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
            contentStyle={{ background: '#111d35', borderColor: '#1e293b', borderRadius: '8px', color: '#e2e8f0' }}
          />
          <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrendProps {
  priceHistory: Record<string, number[]>;
  supportedStocks: string[];
}

export function MarketTrendsChart({ priceHistory, supportedStocks }: TrendProps) {
  // Convert price history arrays to a unified chart data array [{ tick: number, GOOG: price, TSLA: price... }]
  const length = Math.max(...Object.values(priceHistory).map(arr => arr.length), 0);
  const data = Array.from({ length }).map((_, idx) => {
    const item: Record<string, any> = { tick: idx };
    supportedStocks.forEach(ticker => {
      const history = priceHistory[ticker];
      if (history && history.length > idx) {
        item[ticker] = history[idx];
      }
    });
    return item;
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-500">
        Loading historical chart data...
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {supportedStocks.map((ticker, index) => (
              <linearGradient key={ticker} id={`grad-chart-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.01}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.05)" />
          <XAxis 
            dataKey="tick" 
            tickFormatter={(tick) => `${tick}s`}
            stroke="rgba(148,163,184,0.3)" 
            style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
          />
          <YAxis 
            stroke="rgba(148,163,184,0.3)" 
            style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ background: '#111d35', borderColor: '#1e293b', borderRadius: '8px', color: '#e2e8f0' }}
            labelFormatter={(label) => `Tick: ${label}s ago`}
          />
          <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
          {supportedStocks.map((ticker, index) => (
            <Area
              key={ticker}
              type="monotone"
              dataKey={ticker}
              stroke={COLORS[index % COLORS.length]}
              fillOpacity={1}
              fill={`url(#grad-chart-${ticker})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SubscriptionProps {
  subscriptionAnalytics: Record<string, number>;
}

export function SubscriptionAnalyticsChart({ subscriptionAnalytics }: SubscriptionProps) {
  const data = Object.entries(subscriptionAnalytics).map(([ticker, count]) => ({
    name: ticker,
    Subscribers: count,
  })).sort((a, b) => b.Subscribers - a.Subscribers);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.05)" />
          <XAxis 
            dataKey="name" 
            stroke="rgba(148,163,184,0.3)"
            style={{ fontSize: '11px', fontWeight: 600 }}
          />
          <YAxis 
            allowDecimals={false}
            stroke="rgba(148,163,184,0.3)"
            style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
          />
          <Tooltip
            contentStyle={{ background: '#111d35', borderColor: '#1e293b', borderRadius: '8px', color: '#e2e8f0' }}
          />
          <Bar dataKey="Subscribers" fill="#3b82f6" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
