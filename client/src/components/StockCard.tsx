import { useEffect, useRef, useState } from 'react';
import type { StockData } from '../types';
import { PriceChart } from './PriceChart';

export function Sparkline({ history, up }: { history: number[]; up: boolean }) {
  if (history.length < 2) return null;
  const W = 70, H = 28;
  const min = Math.min(...history), max = Math.max(...history);
  const range = max - min || 1;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={up ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  ticker: string;
  data: StockData;
  onUnsubscribe: (t: string) => void;
  priceHistory?: number[];
}

export function StockCard({ ticker, data, onUnsubscribe, priceHistory = [] }: Props) {
  const [flash, setFlash] = useState<'up' | 'down' | ''>('');
  const [localHistory, setLocalHistory] = useState<number[]>(priceHistory.length ? priceHistory : [data.price]);
  const [expanded, setExpanded] = useState(false);
  const prev = useRef(data.price);

  useEffect(() => {
    if (data.price !== prev.current) {
      const dir = data.price > prev.current ? 'up' : 'down';
      setFlash(dir);
      setLocalHistory(h => [...h.slice(-59), data.price]);
      prev.current = data.price;
      const t = setTimeout(() => setFlash(''), 700);
      return () => clearTimeout(t);
    }
  }, [data.price]);

  const change = data.price - data.prevPrice;
  const pct = data.prevPrice ? (change / data.prevPrice) * 100 : 0;
  const isUp = change >= 0;
  const time = data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : '—';
  const dayRange = data.high && data.low ? ((data.price - data.low) / (data.high - data.low)) * 100 : 50;

  return (
    <div className={`stock-card ${isUp ? 'up' : 'down'} ${expanded ? 'expanded' : ''}`}>
      {/* Header */}
      <div className="stock-card-header">
        <div className="sc-ticker-wrap">
          <span className="ticker-badge">{ticker}</span>
          <div className="sc-sector-pill">{data.sector}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-chart-toggle" onClick={() => setExpanded(e => !e)} title="Toggle chart">
            {expanded ? '📉' : '📈'}
          </button>
          <button className="btn-unsub" onClick={() => onUnsubscribe(ticker)}>✕</button>
        </div>
      </div>

      <div className="stock-company">{data.company}</div>

      {/* Price row */}
      <div className="sc-price-row">
        <div className={`stock-price ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}`}>
          ${data.price.toFixed(2)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div className={`stock-change ${isUp ? 'up' : 'down'}`}>
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{change.toFixed(2)}
          </div>
          <div className={`sc-pct ${isUp ? 'up' : 'down'}`}>
            {isUp ? '+' : ''}{pct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart (expanded) */}
      {expanded && (
        <div className="sc-chart-wrap">
          <PriceChart history={localHistory} ticker={ticker} isUp={isUp} width={280} height={100} />
        </div>
      )}

      {/* Sparkline (collapsed) */}
      {!expanded && (
        <div className="sc-spark-row">
          <Sparkline history={localHistory} up={isUp} />
          <span className="live-dot" />
        </div>
      )}

      {/* OHLC */}
      <div className="stock-ohlc">
        <div className="ohlc-item">
          <div className="ohlc-label">Open</div>
          <div className="ohlc-val">${data.openPrice?.toFixed(2) ?? '—'}</div>
        </div>
        <div className="ohlc-item">
          <div className="ohlc-label">High</div>
          <div className="ohlc-val" style={{ color: 'var(--green)' }}>${data.high?.toFixed(2) ?? '—'}</div>
        </div>
        <div className="ohlc-item">
          <div className="ohlc-label">Low</div>
          <div className="ohlc-val" style={{ color: 'var(--red)' }}>${data.low?.toFixed(2) ?? '—'}</div>
        </div>
      </div>

      {/* Day range bar */}
      <div className="sc-range-wrap">
        <span className="ohlc-label">Day Range</span>
        <div className="sc-range-bar">
          <div className="sc-range-fill" style={{ width: `${Math.min(100, Math.max(0, dayRange))}%` }} />
        </div>
        <div className="sc-range-labels">
          <span>${data.low?.toFixed(2)}</span>
          <span>${data.high?.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="stock-footer">
        <span className="stock-timestamp">⏱ {time}</span>
        <span className={`sc-trend ${isUp ? 'up' : 'down'}`}>{isUp ? '↗ Bullish' : '↘ Bearish'}</span>
      </div>
    </div>
  );
}
