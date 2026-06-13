import { useEffect, useState } from 'react';
import { MarketAnalyticsService, type MarketStats } from '../services/MarketAnalyticsService';
import type { StockMap } from '../types';

interface Props {
  stocks: StockMap;
  supportedStocks: string[];
  activeUsers: number;
}

export function MarketOverview({ stocks, supportedStocks, activeUsers }: Props) {
  const [stats, setStats] = useState<MarketStats | null>(null);

  useEffect(() => {
    const calculated = MarketAnalyticsService.calculateStats(stocks, supportedStocks);
    setStats(calculated);
  }, [stocks, supportedStocks]);

  if (!stats) return <p className="text-sm text-slate-400">Loading market statistics...</p>;

  return (
    <div className="space-y-6">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue">🟢</div>
          <div className="stat-info">
            <label>Market Status</label>
            <div className="stat-value text-emerald-400" style={{ color: 'var(--green)' }}>OPEN</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">👥</div>
          <div className="stat-info">
            <label>Active Traders</label>
            <div className="stat-value">{activeUsers} Online</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">📊</div>
          <div className="stat-info">
            <label>Avg Market Change</label>
            <div className={`stat-value ${stats.averageMarketChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} style={{ color: stats.averageMarketChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {stats.averageMarketChange >= 0 ? '+' : ''}{stats.averageMarketChange.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⚡</div>
          <div className="stat-info">
            <label>Volatility index</label>
            <div className="stat-value">{stats.marketVolatility.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <div className="market-summary">
        <div className="market-summary-title">Engine Pulse Analytics</div>
        <div className="profile-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="profile-info-item">
            <label>Top Gainer</label>
            {stats.topGainer ? (
              <div>
                <span className="font-mono font-bold text-emerald-400" style={{ color: 'var(--green)' }}>
                  ▲ {stats.topGainer.ticker} (+{stats.topGainer.changePercent.toFixed(2)}%)
                </span>
                <p className="text-xs text-slate-500" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Price: ${stats.topGainer.price.toFixed(2)}
                </p>
              </div>
            ) : 'N/A'}
          </div>

          <div className="profile-info-item">
            <label>Top Loser</label>
            {stats.topLoser ? (
              <div>
                <span className="font-mono font-bold text-rose-400" style={{ color: 'var(--red)' }}>
                  ▼ {stats.topLoser.ticker} ({stats.topLoser.changePercent.toFixed(2)}%)
                </span>
                <p className="text-xs text-slate-500" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Price: ${stats.topLoser.price.toFixed(2)}
                </p>
              </div>
            ) : 'N/A'}
          </div>

          <div className="profile-info-item">
            <label>Bullish Stocks</label>
            <span className="font-mono text-emerald-400" style={{ color: 'var(--green)' }}>
              ▲ {stats.bullishCount} Tickers
            </span>
          </div>

          <div className="profile-info-item">
            <label>Bearish Stocks</label>
            <span className="font-mono text-rose-400" style={{ color: 'var(--red)' }}>
              ▼ {stats.bearishCount} Tickers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
