import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { StockData } from '../types';

interface Props {
  ticker: string;
  data: StockData;
  priceHistory: number[];
  subscriberCount?: number;
}

export function StockDetails({ ticker, data, priceHistory = [], subscriberCount = 0 }: Props) {
  const chartData = priceHistory.map((price, idx) => ({
    tick: idx,
    Price: price,
  }));

  const change = data.price - data.prevPrice;
  const pct = data.prevPrice ? (change / data.prevPrice) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="market-summary" style={{ paddingBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="ticker-badge" style={{ fontSize: '18px', padding: '6px 14px' }}>{ticker}</span>
            <span className={`sc-trend ${isUp ? 'up' : 'down'}`} style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {isUp ? '↗ Bullish' : '↘ Bearish'}
            </span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>{data.company}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sector: {data.sector}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="stock-price" style={{ fontSize: '36px', margin: 0 }}>
            ${data.price.toFixed(2)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <span className={`stock-change ${isUp ? 'up' : 'down'}`} style={{ padding: '2px 8px', fontSize: '12px' }}>
              {isUp ? '▲ +' : '▼ '}{change.toFixed(2)}
            </span>
            <span className={`sc-pct ${isUp ? 'up' : 'down'}`} style={{ padding: '2px 8px', fontSize: '12px' }}>
              {isUp ? '+' : ''}{pct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', margin: '20px 0', padding: '16px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <div className="ohlc-item">
          <div className="ohlc-label">Open Price</div>
          <div className="ohlc-val" style={{ fontSize: '14px' }}>${data.openPrice?.toFixed(2) ?? '—'}</div>
        </div>
        <div className="ohlc-item">
          <div className="ohlc-label">Daily High</div>
          <div className="ohlc-val" style={{ fontSize: '14px', color: 'var(--green)' }}>${data.high?.toFixed(2) ?? '—'}</div>
        </div>
        <div className="ohlc-item">
          <div className="ohlc-label">Daily Low</div>
          <div className="ohlc-val" style={{ fontSize: '14px', color: 'var(--red)' }}>${data.low?.toFixed(2) ?? '—'}</div>
        </div>
        <div className="ohlc-item">
          <div className="ohlc-label">Watchers</div>
          <div className="ohlc-val" style={{ fontSize: '14px', color: 'var(--accent)' }}>{subscriberCount} Users</div>
        </div>
      </div>

      {/* Main Historical Recharts Graph */}
      <div style={{ height: '320px', width: '100%', marginTop: '24px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Real-Time Price Trend (Last 60 Seconds)
        </div>
        
        {chartData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', color: 'var(--text-muted)' }}>
            No price history cached yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-details-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? 'var(--green)' : 'var(--red)'} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={isUp ? 'var(--green)' : 'var(--red)'} stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.05)" />
              <XAxis 
                dataKey="tick" 
                tickFormatter={(val) => `${val}s`}
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
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Tick: ${label}s ago`}
              />
              <Area
                type="monotone"
                dataKey="Price"
                stroke={isUp ? 'var(--green)' : 'var(--red)'}
                fillOpacity={1}
                fill={`url(#grad-details-${ticker})`}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
