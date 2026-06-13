import { useState, useEffect } from 'react';
import { useTradeStore } from '../stores/useTradeStore';
import type { Notification } from '../types';

interface AlertRule {
  id: string;
  ticker: string;
  condition: 'gt' | 'lt';
  value: number;
  active: boolean;
}

export function PriceAlerts() {
  const { supportedStocks, stocks, addNotification, stockMeta } = useTradeStore();
  const [ticker, setTicker] = useState(supportedStocks[0] || 'GOOG');
  const [condition, setCondition] = useState<'gt' | 'lt'>('gt');
  const [value, setValue] = useState('');
  const [alerts, setAlerts] = useState<AlertRule[]>([]);

  // Monitor stock prices to evaluate active alerts
  useEffect(() => {
    alerts.forEach(alert => {
      if (!alert.active) return;
      const stock = stocks[alert.ticker];
      if (!stock) return;

      let triggered = false;
      if (alert.condition === 'gt' && stock.price >= alert.value) {
        triggered = true;
      } else if (alert.condition === 'lt' && stock.price <= alert.value) {
        triggered = true;
      }

      if (triggered) {
        // Deactivate alert
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: false } : a));

        // Send alert notification
        const condSymbol = alert.condition === 'gt' ? '▲ rose above' : '▼ fell below';
        const msg = `Price Alert Triggered: ${alert.ticker} ${condSymbol} target $${alert.value.toFixed(2)} (Current: $${stock.price.toFixed(2)})`;
        
        const notif: Notification = {
          id: Date.now() + Math.random(),
          ticker: alert.ticker,
          message: msg,
          type: alert.condition === 'gt' ? 'success' : 'warning',
          timestamp: new Date().toISOString(),
          read: false
        };
        addNotification(notif);
      }
    });
  }, [stocks, alerts, addNotification]);

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(value);
    if (isNaN(val) || val <= 0) return;

    const newAlert: AlertRule = {
      id: Date.now().toString(),
      ticker,
      condition,
      value: val,
      active: true
    };

    setAlerts(prev => [newAlert, ...prev]);
    setValue('');
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="market-summary">
        <div className="market-summary-title">Set Stock Price Alert</div>
        <form onSubmit={handleAddAlert} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ticker</label>
            <select 
              value={ticker} 
              onChange={e => setTicker(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
            >
              {supportedStocks.map(t => (
                <option key={t} value={t}>{t} - {stockMeta[t]?.company}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Condition</label>
            <select 
              value={condition} 
              onChange={e => setCondition(e.target.value as 'gt' | 'lt')}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="gt">Is Greater Than ( &gt; )</option>
              <option value="lt">Is Less Than ( &lt; )</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Price Threshold ($)</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="e.g. 200.00" 
              value={value} 
              onChange={e => setValue(e.target.value)} 
              required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <button className="btn-subscribe" type="submit" style={{ padding: '11px 22px' }}>
            Create Alert
          </button>
        </form>
      </div>

      <div className="market-summary" style={{ marginTop: '20px' }}>
        <div className="market-summary-title">Active Price Alert Rules ({alerts.length})</div>
        {alerts.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
            No price alerts configured. Set a threshold above to receive alerts on live volatility updates.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 14px', 
                  background: 'var(--bg-input)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px' 
                }}
              >
                <div>
                  <span className="ticker-badge" style={{ fontSize: '12px', marginRight: '10px' }}>{alert.ticker}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Trigger when price is {alert.condition === 'gt' ? 'above' : 'below'}{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>${alert.value.toFixed(2)}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: 'bold', 
                      color: alert.active ? 'var(--green)' : 'var(--text-muted)',
                      background: alert.active ? 'var(--green-dim)' : 'transparent',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}
                  >
                    {alert.active ? '● Monitoring' : '○ Triggered'}
                  </span>
                  <button className="btn-unsub" onClick={() => removeAlert(alert.id)}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
