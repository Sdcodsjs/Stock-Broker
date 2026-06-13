import { PortfolioAllocationChart } from './AnalyticsChart';
import type { StockMap } from '../types';

interface Props {
  balance: number;
  portfolio: Record<string, number>;
  stocks: StockMap;
}

export function PortfolioAnalytics({ balance, portfolio, stocks }: Props) {
  const initialValue = 100000;
  
  // Calculate invested amount
  let investedAmount = 0;
  Object.entries(portfolio).forEach(([ticker, shares]) => {
    const price = stocks[ticker]?.price || 0;
    investedAmount += shares * price;
  });

  const totalValue = balance + investedAmount;
  const netProfitLoss = totalValue - initialValue;
  const roi = (netProfitLoss / initialValue) * 100;

  // Best / Worst performers in holdings based on daily stock change %
  let bestPerformer: { ticker: string; changePercent: number } | null = null;
  let worstPerformer: { ticker: string; changePercent: number } | null = null;

  Object.keys(portfolio).forEach(ticker => {
    const data = stocks[ticker];
    if (!data) return;
    const change = data.price - data.prevPrice;
    const changePercent = data.prevPrice ? (change / data.prevPrice) * 100 : 0;

    if (!bestPerformer || changePercent > bestPerformer.changePercent) {
      bestPerformer = { ticker, changePercent };
    }
    if (!worstPerformer || changePercent < worstPerformer.changePercent) {
      worstPerformer = { ticker, changePercent };
    }
  });

  return (
    <div className="space-y-6" style={{ marginTop: '20px' }}>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue">💰</div>
          <div className="stat-info">
            <label>Net Portfolio Value</label>
            <div className="stat-value">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📈</div>
          <div className="stat-info">
            <label>Invested Assets</label>
            <div className="stat-value">${investedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">💵</div>
          <div className="stat-info">
            <label>Available cash</label>
            <div className="stat-value">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📊</div>
          <div className="stat-info">
            <label>Net ROI %</label>
            <div className={`stat-value ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} style={{ color: roi >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="profile-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%', marginTop: '16px' }}>
        <div className="market-summary" style={{ margin: 0, minWidth: 0, overflow: 'hidden' }}>
          <div className="market-summary-title">Holdings Allocation</div>
          <PortfolioAllocationChart holdings={portfolio} prices={stocks} />
        </div>

        <div className="market-summary" style={{ margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
          <div>
            <div className="market-summary-title">Trading Highlights</div>
            <div className="profile-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px' }}>
              <div className="profile-info-item">
                <label>Net Profit / Loss</label>
                <span className="font-mono text-lg font-bold" style={{ color: netProfitLoss >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '16px' }}>
                  {netProfitLoss >= 0 ? '+$' : '-$'}{Math.abs(netProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="profile-info-item">
                <label>Best Performing Holding</label>
                {bestPerformer ? (
                  <span className="font-mono" style={{ color: (bestPerformer as any).changePercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {(bestPerformer as any).ticker} ({(bestPerformer as any).changePercent >= 0 ? '+' : ''}{(bestPerformer as any).changePercent.toFixed(2)}% today)
                  </span>
                ) : <span className="text-slate-500">No holdings</span>}
              </div>
              <div className="profile-info-item">
                <label>Worst Performing Holding</label>
                {worstPerformer ? (
                  <span className="font-mono" style={{ color: (worstPerformer as any).changePercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {(worstPerformer as any).ticker} ({(worstPerformer as any).changePercent >= 0 ? '+' : ''}{(worstPerformer as any).changePercent.toFixed(2)}% today)
                  </span>
                ) : <span className="text-slate-500">No holdings</span>}
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            * Performers are calculated based on today's price volatility relative to daily opening tick.
          </div>
        </div>
      </div>
    </div>
  );
}
