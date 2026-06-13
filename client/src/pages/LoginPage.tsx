import { useState } from 'react';
import { loginUser } from '../services/api';
import type { User, Theme, StockMap } from '../types';

interface Props {
  onLogin: (user: User, stocks: string[], meta: Record<string, { company: string; sector: string }>, prices: StockMap) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function LoginPage({ onLogin, theme, onToggleTheme }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email cannot be empty'); return; }
    setLoading(true); setError('');
    try {
      const d = await loginUser(email.trim());
      onLogin(
        { 
          email: d.email, 
          token: d.token, 
          subscriptions: d.subscriptions,
          isAdmin: d.isAdmin,
          balance: d.balance,
          portfolio: d.portfolio
        },
        d.supportedStocks, 
        d.stockMeta, 
        d.currentPrices
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ position: 'absolute', top: 20, right: 24 }}>
          <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme"
            style={{ background: 'transparent', border: '1px solid var(--border)' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="login-logo">
          <div className="login-logo-icon">📈</div>
          <div className="login-logo-text">
            <h1>TradeDesk</h1>
            <span>Real-Time Market Portal</span>
          </div>
        </div>

        <h2 className="login-headline">Welcome back</h2>
        <p className="login-sub">Sign in with your email to access live markets</p>

        <form onSubmit={handle}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" placeholder="e.g. john@gmail.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : '→ Sign In'}
          </button>
          {error && <div className="error-msg">⚠️ {error}</div>}
        </form>

        <div className="login-hint">
          <p>Demo accounts (open in two separate windows):</p>
          <code className="hint-email" onClick={() => setEmail('john@gmail.com')}>john@gmail.com</code>
          <code className="hint-email" onClick={() => setEmail('alice@gmail.com')}>alice@gmail.com</code>
        </div>
      </div>
    </div>
  );
}
