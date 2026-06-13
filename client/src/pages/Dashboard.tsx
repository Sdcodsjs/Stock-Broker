import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StockCard } from '../components/StockCard';
import { NotificationPanel } from '../components/NotificationPanel';
import { ToastContainer } from '../components/ToastContainer';
import { ActivityLogPanel } from '../components/ActivityLogPanel';
import { createSocket, getSocket, disconnectSocket, API_BASE } from '../services/socket';
import type { StockMap, Notification, ActivityLog, AdminStats } from '../types';

// New Additive Upgrade Components & Utilities
import { useTradeStore } from '../stores/useTradeStore';
import { MarketOverview } from '../components/MarketOverview';
import { PortfolioAnalytics } from '../components/PortfolioAnalytics';
import { StockDetails } from '../components/StockDetails';
import { PriceAlerts } from '../components/PriceAlerts';
import { SystemMetrics } from '../components/SystemMetrics';
import { ArchitecturePage } from './ArchitecturePage';
import { MarketTrendsChart, SubscriptionAnalyticsChart } from '../components/AnalyticsChart';
import { ExportHelper } from '../utils/exportHelper';

type Page = 'home' | 'watchlist' | 'charts' | 'activity' | 'profile' | 'settings' | 'portfolio' | 'portfolio-analytics' | 'price-alerts' | 'admin' | 'system-metrics' | 'architecture' | 'stock-details';
type SectorFilter = 'All' | 'Technology' | 'Automotive' | 'E-Commerce' | 'Social Media' | 'Semiconductors';

interface Props {
  pageType: Page;
  onLogout: () => void;
}

export function Dashboard({ pageType, onLogout }: Props) {
  const navigate = useNavigate();
  const { ticker } = useParams();

  // Pull states & actions from Zustand store
  const {
    user,
    supportedStocks,
    stockMeta,
    stocks,
    marketPrices,
    priceHistory,
    subscriptions,
    notifications,
    activityLogs,
    balance,
    portfolio,
    theme,
    buyQty,
    toggleTheme,
    setSubscriptions,
    updateStocks,
    updateMarketSnapshot,
    setPriceHistory,
    setNotifications,
    addNotification,
    setActivityLogs,
    updatePortfolio,
    setBuyQty,
    clearBuyQty,
  } = useTradeStore();

  const [connected, setConnected] = useState(false);
  const [connStatus, setConnStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subError, setSubError] = useState('');
  
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loginTime] = useState(new Date().toLocaleString());
  const unreadCount = notifications.filter(n => !n.read).length;

  // Sync HTTP Activity Logs and Notifications on mount or token change
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/activity`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json()).then(setActivityLogs).catch(() => {});
    fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json()).then(setNotifications).catch(() => {});
  }, [user?.token, setActivityLogs, setNotifications]);

  // WebSocket Lifecycle Manager
  useEffect(() => {
    if (!user) return;
    const socket = createSocket(user.token);

    socket.on('connect', () => { 
      setConnected(true); 
      setConnStatus('connected'); 
    });
    
    socket.on('disconnect', () => { 
      setConnected(false); 
      setConnStatus('disconnected'); 
    });
    
    socket.on('connect_error', () => {
      setConnStatus('reconnecting');
    });
    
    socket.on('subscriptions', (subs: string[]) => {
      setSubscriptions(subs);
    });
    
    socket.on('allPrices', (data: StockMap) => { 
      updateStocks(data); 
      updateMarketSnapshot(data); 
    });
    
    socket.on('stockUpdate', (data: StockMap) => {
      updateStocks(data);
    });
    
    socket.on('marketSnapshot', (data: StockMap) => {
      updateMarketSnapshot(data);
    });
    
    socket.on('priceHistory', (hist: Record<string, number[]>) => {
      setPriceHistory(hist);
    });
    
    socket.on('notification', (n: Notification) => {
      addNotification(n);
    });
    
    socket.on('notifications', (list: Notification[]) => {
      setNotifications(list);
    });
    
    socket.on('subscribeError', ({ message }: { ticker: string; message: string }) => {
      setSubError(message); 
      setTimeout(() => setSubError(''), 3000);
    });
    
    socket.on('subscribeSuccess', ({ ticker }: { ticker: string }) => {
      setActivityLogs([
        { 
          id: Date.now(), 
          action: 'subscribe', 
          detail: `Subscribed to ${ticker}`, 
          timestamp: new Date().toISOString() 
        } as ActivityLog, 
        ...activityLogs
      ]);
    });

    return () => { 
      disconnectSocket(); 
    };
  }, [user?.token, updateStocks, updateMarketSnapshot, setSubscriptions, setPriceHistory, addNotification, setNotifications, setActivityLogs, activityLogs]);

  // Actions wrapped in useCallback
  const subscribe = useCallback((t: string) => { 
    getSocket()?.emit('subscribe', t); 
  }, []);

  const unsubscribe = useCallback((t: string) => {
    getSocket()?.emit('unsubscribe', t);
    // Locally remove ticker from current price cache
    const updatedStocks = { ...stocks };
    delete updatedStocks[t];
    updateStocks(updatedStocks);
    setActivityLogs([
      { 
        id: Date.now(), 
        action: 'unsubscribe', 
        detail: `Unsubscribed from ${t}`, 
        timestamp: new Date().toISOString() 
      } as ActivityLog, 
      ...activityLogs
    ]);
  }, [stocks, updateStocks, setActivityLogs, activityLogs]);

  const clearNotifs = useCallback(() => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    if (user) {
      fetch(`${API_BASE}/notifications/read-all`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${user.token}` } 
      }).catch(() => {});
    }
  }, [user, notifications, setNotifications]);

  const handleBuy = async (t: string) => {
    if (!user) return;
    const shares = parseInt(buyQty[t] || '0');
    if (!shares || shares <= 0) return;
    try {
      const r = await fetch(`${API_BASE}/portfolio/buy`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ ticker: t, shares })
      });
      const data = await r.json();
      if (data.error) {
        alert(data.error);
      } else {
        updatePortfolio(data.balance, data.portfolio);
        clearBuyQty(t);
        setActivityLogs([
          { 
            id: Date.now(), 
            action: 'buy', 
            detail: `Bought ${shares} shares of ${t}`, 
            timestamp: new Date().toISOString() 
          } as ActivityLog, 
          ...activityLogs
        ]);
      }
    } catch (e) { console.error(e); }
  };

  const handleSell = async (t: string, shares: number) => {
    if (!user) return;
    try {
      const r = await fetch(`${API_BASE}/portfolio/sell`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ ticker: t, shares })
      });
      const data = await r.json();
      if (data.error) {
        alert(data.error);
      } else {
        updatePortfolio(data.balance, data.portfolio);
        setActivityLogs([
          { 
            id: Date.now(), 
            action: 'sell', 
            detail: `Sold ${shares} shares of ${t}`, 
            timestamp: new Date().toISOString() 
          } as ActivityLog, 
          ...activityLogs
        ]);
      }
    } catch (e) { console.error(e); }
  };

  const loadAdminStats = useCallback(() => {
    if (!user || !user.isAdmin) return;
    fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json()).then(setAdminStats).catch(() => {});
  }, [user]);

  const toggleFeed = async () => {
    if (!user || !adminStats) return;
    try {
      const r = await fetch(`${API_BASE}/admin/feed`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ active: !adminStats.feedActive })
      });
      const data = await r.json();
      setAdminStats(prev => prev ? { ...prev, feedActive: data.feedActive } : null);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (pageType === 'admin') loadAdminStats();
  }, [pageType, loadAdminStats]);

  if (!user) return null;

  const sectors = ['All', ...Array.from(new Set(supportedStocks.map(t => stockMeta[t]?.sector).filter(Boolean)))] as SectorFilter[];

  const filterStocks = (list: string[]) => list.filter(t => {
    const matchSearch = t.toLowerCase().includes(search.toLowerCase()) || (stockMeta[t]?.company ?? '').toLowerCase().includes(search.toLowerCase());
    const matchSector = sectorFilter === 'All' || stockMeta[t]?.sector === sectorFilter;
    return matchSearch && matchSector;
  });

  const gainers = supportedStocks.filter(t => { const d = marketPrices[t]; return d && d.price > d.prevPrice; });
  const losers  = supportedStocks.filter(t => { const d = marketPrices[t]; return d && d.price <= d.prevPrice; });

  const marqueeItems = [...supportedStocks, ...supportedStocks].map((t, i) => {
    const d = marketPrices[t];
    const chg = d ? ((d.price - d.prevPrice) / (d.prevPrice || 1)) * 100 : 0;
    return { t, d, chg, key: `${t}-${i}` };
  });

  // Sidebar navigation mapping
  const NAV = [
    { id: 'home',                  path: '/dashboard',           icon: '🏠', label: 'Market Overview' },
    { id: 'watchlist',             path: '/watchlist',           icon: '📊', label: 'My Watchlist' },
    { id: 'charts',                path: '/charts',              icon: '📈', label: 'Advanced Charts' },
    { id: 'portfolio',             path: '/portfolio',           icon: '💰', label: 'Trading Simulator' },
    { id: 'portfolio-analytics',   path: '/portfolio-analytics', icon: '📈', label: 'Portfolio Analytics' },
    { id: 'price-alerts',          path: '/price-alerts',        icon: '🔔', label: 'Price Alerts' },
    { id: 'activity',              path: '/activity',            icon: '📋', label: 'Activity Logs' },
    { id: 'profile',               path: '/profile',             icon: '👤', label: 'User Profile' },
    { id: 'settings',              path: '/settings',            icon: '⚙️', label: 'Settings' },
    { id: 'architecture',          path: '/architecture',        icon: '🧱', label: 'Architecture Guide' },
  ];

  if (user.isAdmin) {
    NAV.push({ id: 'admin',          path: '/admin-portal',        icon: '🛡️', label: 'Admin Dashboard' });
    NAV.push({ id: 'system-metrics', path: '/system-metrics',      icon: '⚙️', label: 'System Metrics' });
  }

  return (
    <div className="app-layout">
      {/* Overlay (mobile navigation) */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📈</div>
          <div>
            <div className="sidebar-logo-text">TradeDesk</div>
            <div className="sidebar-logo-sub">Live Market Portal</div>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.email.slice(0, 2).toUpperCase()}</div>
          <div className="sidebar-user-label">Logged in as</div>
          <div className="sidebar-user-email">{user.email}</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(item => (
            <button 
              key={item.id} 
              className={`nav-item ${pageType === item.id ? 'active' : ''}`} 
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.id === 'watchlist' && subscriptions.length > 0 &&
                <span className="nav-badge">{subscriptions.length}</span>}
              {item.id === 'activity' && unreadCount > 0 &&
                <span className="nav-badge" style={{ background: 'var(--accent)' }}>{unreadCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className={`conn-badge ${connStatus}`}>
            <span className="conn-dot" />
            {connStatus === 'connected' ? '● Live Feed' : connStatus === 'reconnecting' ? '↺ Reconnecting…' : '○ Disconnected'}
          </div>
          <button className="nav-item" onClick={onLogout} style={{ color: 'var(--red)' }}>
            <span className="nav-icon">🚪</span>Logout
          </button>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <div className="main-content">
        
        {/* Topbar */}
        <div className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div style={{ flex: 1 }}>
            <div className="topbar-title">
              {pageType === 'home'                && '🏠 Market Overview'}
              {pageType === 'watchlist'           && '📊 My Watchlist'}
              {pageType === 'charts'              && '📈 Advanced Charts'}
              {pageType === 'portfolio'           && '💰 Trading Simulator'}
              {pageType === 'portfolio-analytics' && '📈 Portfolio Analytics'}
              {pageType === 'price-alerts'        && '🔔 Live Price Alerts'}
              {pageType === 'activity'            && '📋 Activity Log'}
              {pageType === 'profile'             && '👤 User Profile'}
              {pageType === 'settings'            && '⚙️ Settings'}
              {pageType === 'admin'               && '🛡️ Admin Dashboard'}
              {pageType === 'system-metrics'      && '⚙️ System Metrics'}
              {pageType === 'architecture'        && '🧱 Architecture Design'}
              {pageType === 'stock-details'       && `📈 Stock Details — ${ticker}`}
            </div>
            <div className="topbar-subtitle">Real-time WebSocket · Updates every second</div>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" title="Toggle theme" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="icon-btn" title="Notifications" onClick={() => setShowNotifs(v => !v)} style={{ position: 'relative' }}>
              🔔
              {unreadCount > 0 && 
                <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount}
                </span>}
            </button>
          </div>
        </div>

        {/* Ticker Marquee */}
        <div className="ticker-marquee">
          <div className="ticker-marquee-inner">
            {marqueeItems.map(({ t, d, chg, key }) => (
              <div key={key} className="tm-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${t}`)}>
                <span className="tm-sym">{t}</span>
                <span className="tm-price">${d?.price.toFixed(2) ?? '—'}</span>
                <span className={`tm-chg ${chg >= 0 ? 'up' : 'down'}`}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        {showNotifs && <NotificationPanel notifications={notifications} onClose={() => setShowNotifs(false)} onClearAll={clearNotifs} />}

        <div className="page-content">
          
          {/* Market Summary bar (shown on watchlist + home) */}
          {(pageType === 'watchlist' || pageType === 'home') && (
            <div className="market-summary">
              <div className="market-summary-title">Market Pulse</div>
              <div className="summary-row">
                <div className="summary-item"><label>Tracked</label><div className="summary-val accent">{supportedStocks.length}</div></div>
                <div className="summary-item"><label>Subscribed</label><div className="summary-val accent">{subscriptions.length}</div></div>
                <div className="summary-item"><label>Gainers</label><div className="summary-val green">▲ {gainers.length}</div></div>
                <div className="summary-item"><label>Losers</label><div className="summary-val red">▼ {losers.length}</div></div>
                <div className="summary-item"><label>Feed Status</label><div className={`summary-val ${connected ? 'green' : 'red'}`}>{connected ? '🟢 Live' : '🔴 Offline'}</div></div>
              </div>
            </div>
          )}

          {/* ── HOME (MARKET OVERVIEW + STOCK GRID) ── */}
          {pageType === 'home' && (
            <div className="space-y-6">
              <MarketOverview 
                stocks={stocks} 
                supportedStocks={supportedStocks} 
                activeUsers={adminStats?.activeUsers ?? 1} 
              />
              
              <div className="search-box" style={{ marginTop: '24px' }}>
                <span className="search-icon">🔍</span>
                <input placeholder="Search by ticker or company name…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              
              <div className="filter-chips">
                {sectors.map(s => (
                  <button key={s} className={`filter-chip ${sectorFilter === s ? 'active' : ''}`} onClick={() => setSectorFilter(s)}>{s}</button>
                ))}
              </div>
              
              <div className="section-header">
                <span className="section-title">All Market Stocks ({filterStocks(supportedStocks).length})</span>
              </div>
              
              <div className="market-grid">
                {filterStocks(supportedStocks).map(t => {
                  const d = marketPrices[t];
                  const isSubbed = subscriptions.includes(t);
                  const chg = d ? ((d.price - d.prevPrice) / (d.prevPrice || 1)) * 100 : 0;
                  const isUp = chg >= 0;
                  return (
                    <div key={t} className="market-card">
                      <div className="market-card-left" style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${t}`)}>
                        <div className="market-icon">{t[0]}</div>
                        <div>
                          <div className="market-ticker">{t}</div>
                          <div className="market-company">{stockMeta[t]?.company}</div>
                          <div className="market-company" style={{ fontSize: 10 }}>{stockMeta[t]?.sector}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 12, minWidth: 90 }}>
                        <div className="market-price-val">${d?.price.toFixed(2) ?? '—'}</div>
                        <div className={`market-price-chg ${isUp ? 'up' : 'down'}`}>
                          {isUp ? '▲ +' : '▼ '}{chg.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                          H: ${d?.high?.toFixed(2)} L: ${d?.low?.toFixed(2)}
                        </div>
                      </div>
                      {isSubbed
                        ? <span className="btn-subscribed">✓ Subscribed</span>
                        : <button className="btn-subscribe" onClick={() => subscribe(t)} disabled={subscriptions.length >= 5}>+ Add</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── WATCHLIST ── */}
          {pageType === 'watchlist' && (
            <>
              <div className="stats-row">
                <div className="stat-card"><div className="stat-icon blue">📊</div><div className="stat-info"><label>Subscriptions</label><div className="stat-value">{subscriptions.length} / 5</div></div></div>
                <div className="stat-card"><div className="stat-icon green">▲</div><div className="stat-info"><label>Gainers</label><div className="stat-value">{subscriptions.filter(t => stocks[t] && stocks[t].price > stocks[t].prevPrice).length}</div></div></div>
                <div className="stat-card"><div className="stat-icon yellow">▼</div><div className="stat-info"><label>Losers</label><div className="stat-value">{subscriptions.filter(t => stocks[t] && stocks[t].price <= stocks[t].prevPrice).length}</div></div></div>
                <div className="stat-card"><div className="stat-icon cyan">🔔</div><div className="stat-info"><label>Alerts</label><div className="stat-value">{unreadCount}</div></div></div>
              </div>

              {subError && <div className="error-msg" style={{ marginBottom: 14 }}>⚠️ {subError}</div>}

              <div className="section-header">
                <span className="section-title">My Stocks ({subscriptions.length})</span>
                {subscriptions.length > 0 &&
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-export" onClick={() => {
                      const data = subscriptions.map(t => {
                        const d = stocks[t];
                        const c = d ? (((d.price - d.prevPrice) / d.prevPrice) * 100).toFixed(2) : '0';
                        return { Ticker: t, Company: d?.company, Sector: d?.sector, Price: d?.price, ChangePercent: c, High: d?.high, Low: d?.low };
                      });
                      ExportHelper.toCSV(data, `watchlist_${user.email}`);
                    }}>CSV ⬇</button>
                    <button className="btn-export" onClick={() => {
                      const data = subscriptions.map(t => {
                        const d = stocks[t];
                        const c = d ? (((d.price - d.prevPrice) / d.prevPrice) * 100).toFixed(2) : '0';
                        return { Ticker: t, Company: d?.company, Sector: d?.sector, Price: d?.price, ChangePercent: c, High: d?.high, Low: d?.low };
                      });
                      ExportHelper.toJSON(data, `watchlist_${user.email}`);
                    }}>JSON ⬇</button>
                    <button className="btn-export" onClick={() => {
                      const headers = ['Ticker', 'Company', 'Sector', 'Price', 'Change%', 'High', 'Low'];
                      const rows = subscriptions.map(t => {
                        const d = stocks[t];
                        const c = d ? parseFloat((((d.price - d.prevPrice) / d.prevPrice) * 100).toFixed(2)) : 0;
                        return [t, d?.company, d?.sector, d?.price, c, d?.high, d?.low];
                      });
                      ExportHelper.toExcel(headers, rows, 'Watchlist', `watchlist_${user.email}`);
                    }}>Excel ⬇</button>
                  </div>}
              </div>

              {subscriptions.length === 0
                ? <div className="empty-state"><div className="empty-icon">📉</div><h3>Nothing subscribed yet</h3><p>Go to Market → click "+ Add" on any stock</p></div>
                : <div className="stock-grid">
                    {subscriptions.map(t => (
                      <StockCard 
                        key={t} 
                        ticker={t}
                        data={stocks[t] ?? { price: 0, prevPrice: 0, openPrice: 0, high: 0, low: 0, company: stockMeta[t]?.company ?? t, sector: stockMeta[t]?.sector ?? '', updatedAt: '' }}
                        priceHistory={priceHistory[t] ?? []}
                        onUnsubscribe={unsubscribe} 
                      />
                    ))}
                  </div>}
            </>
          )}

          {/* ── CHARTS (RECHARTS + SVG STOCK CARDS) ── */}
          {pageType === 'charts' && (
            <div className="space-y-6">
              <div className="market-summary">
                <div className="market-summary-title">Unified Market Trends</div>
                <MarketTrendsChart priceHistory={priceHistory} supportedStocks={supportedStocks} />
              </div>

              <div className="section-header" style={{ marginTop: '24px' }}>
                <span className="section-title">Technical Chart Snapshots (Select for details)</span>
              </div>

              <div className="stock-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {supportedStocks.map(t => (
                  <div key={t} style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${t}`)}>
                    <StockCard 
                      ticker={t}
                      data={marketPrices[t] ?? { price: 0, prevPrice: 0, openPrice: 0, high: 0, low: 0, company: stockMeta[t]?.company ?? t, sector: stockMeta[t]?.sector ?? '', updatedAt: '' }}
                      priceHistory={priceHistory[t] ?? []}
                      onUnsubscribe={() => {}} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STOCK DETAILS ── */}
          {pageType === 'stock-details' && ticker && marketPrices[ticker] && (
            <StockDetails 
              ticker={ticker}
              data={marketPrices[ticker]}
              priceHistory={priceHistory[ticker] ?? []}
              subscriberCount={adminStats?.subscriptionAnalytics[ticker] ?? 0}
            />
          )}

          {/* ── ACTIVITY LOGS ── */}
          {pageType === 'activity' && (
            <>
              <div className="section-header">
                <span className="section-title">Activity Log ({activityLogs.length})</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-export" onClick={() => {
                    ExportHelper.toCSV(activityLogs, `activity_${user.email}`);
                  }}>CSV ⬇</button>
                  <button className="btn-export" onClick={() => {
                    ExportHelper.toJSON(activityLogs, `activity_${user.email}`);
                  }}>JSON ⬇</button>
                  <button className="btn-export" onClick={() => {
                    const headers = ['Action', 'Detail', 'Timestamp'];
                    const rows = activityLogs.map(l => [l.action, l.detail, l.timestamp]);
                    ExportHelper.toExcel(headers, rows, 'Activity Log', `activity_${user.email}`);
                  }}>Excel ⬇</button>
                </div>
              </div>
              <ActivityLogPanel logs={activityLogs} />
            </>
          )}

          {/* ── PORTFOLIO SIMULATOR ── */}
          {pageType === 'portfolio' && (
            <div style={{ maxWidth: 800 }}>
              <div className="market-summary" style={{ paddingBottom: 24 }}>
                <div className="market-summary-title">Virtual Trading Balance</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)', marginTop: 8 }}>
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Initial Balance: $100,000.00</div>
              </div>

              <div className="market-summary">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="market-summary-title">My Holdings</div>
                  {Object.keys(portfolio).length > 0 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-export" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => {
                        const data = Object.entries(portfolio).map(([t, shares]) => ({ Ticker: t, Shares: shares, Price: marketPrices[t]?.price || 0, TotalValue: shares * (marketPrices[t]?.price || 0) }));
                        ExportHelper.toCSV(data, `holdings_${user.email}`);
                      }}>CSV ⬇</button>
                      <button className="btn-export" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => {
                        const data = Object.entries(portfolio).map(([t, shares]) => ({ Ticker: t, Shares: shares, Price: marketPrices[t]?.price || 0, TotalValue: shares * (marketPrices[t]?.price || 0) }));
                        ExportHelper.toJSON(data, `holdings_${user.email}`);
                      }}>JSON ⬇</button>
                      <button className="btn-export" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => {
                        const headers = ['Ticker', 'Shares', 'Current Price', 'Total Value'];
                        const rows = Object.entries(portfolio).map(([t, shares]) => [t, shares, marketPrices[t]?.price || 0, shares * (marketPrices[t]?.price || 0)]);
                        ExportHelper.toExcel(headers, rows, 'Holdings', `holdings_${user.email}`);
                      }}>Excel ⬇</button>
                    </div>
                  )}
                </div>
                
                {Object.keys(portfolio).length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No stocks in portfolio yet. Buy some below.</p>
                ) : (
                  <div className="market-grid" style={{ gridTemplateColumns: '1fr', gap: 8, marginTop: '12px' }}>
                    {Object.entries(portfolio).map(([t, shares]) => {
                      const d = marketPrices[t];
                      const currentValue = shares * (d?.price || 0);
                      return (
                        <div key={t} className="market-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="market-icon">{t[0]}</div>
                            <div>
                              <div className="market-ticker">{t}</div>
                              <div className="market-company">{shares} shares</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="market-price-val">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@ ${d?.price.toFixed(2)} / share</div>
                          </div>
                          <div>
                            <button className="btn-unsub" onClick={() => handleSell(t, shares)}>Sell All</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="market-summary">
                <div className="market-summary-title">Buy Stocks</div>
                <div className="market-grid">
                  {supportedStocks.map(t => {
                    const d = marketPrices[t];
                    return (
                      <div key={t} className="market-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div className="market-ticker">{t}</div>
                            <div className="market-company">${d?.price.toFixed(2) ?? '—'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input 
                            type="number" 
                            min="1"
                            placeholder="Qty" 
                            style={{ width: 80, padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                            value={buyQty[t] || ''} 
                            onChange={e => setBuyQty(t, e.target.value)} 
                          />
                          <button className="btn-subscribe" onClick={() => handleBuy(t)}>Buy</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── PORTFOLIO ANALYTICS ── */}
          {pageType === 'portfolio-analytics' && (
            <PortfolioAnalytics 
              balance={balance} 
              portfolio={portfolio} 
              stocks={marketPrices} 
            />
          )}

          {/* ── PRICE ALERTS ── */}
          {pageType === 'price-alerts' && (
            <PriceAlerts />
          )}

          {/* ── ARCHITECTURE GUIDE ── */}
          {pageType === 'architecture' && (
            <ArchitecturePage />
          )}

          {/* ── SYSTEM METRICS ── */}
          {pageType === 'system-metrics' && (
            <SystemMetrics adminStats={adminStats} dbConnected={true} />
          )}

          {/* ── PROFILE ── */}
          {pageType === 'profile' && (
            <div style={{ maxWidth: 520 }}>
              <div className="market-summary" style={{ textAlign: 'center', paddingBottom: 24 }}>
                <div className="market-summary-title" style={{ textAlign: 'left' }}>My Account</div>
                <div className="profile-avatar-lg">{user.email.slice(0, 2).toUpperCase()}</div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.4px' }}>{user.email.split('@')[0]}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{user.email}</div>
                <div className="profile-info-grid">
                  <div className="profile-info-item"><label>Subscriptions</label><span>{subscriptions.length} / 5</span></div>
                  <div className="profile-info-item"><label>Alerts Received</label><span>{notifications.length}</span></div>
                  <div className="profile-info-item"><label>Feed Status</label><span style={{ color: connected ? 'var(--green)' : 'var(--red)' }}>{connected ? '🟢 Live' : '🔴 Offline'}</span></div>
                  <div className="profile-info-item"><label>Session Start</label><span style={{ fontSize: 12 }}>{loginTime}</span></div>
                </div>
              </div>
              <div className="market-summary">
                <div className="market-summary-title">Subscribed Stocks</div>
                {subscriptions.length === 0
                  ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No subscriptions yet</p>
                  : subscriptions.map(t => {
                      const d = stocks[t];
                      const chg = d ? ((d.price - d.prevPrice) / d.prevPrice * 100) : 0;
                      return (
                        <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{t}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{stockMeta[t]?.company}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 600 }}>${d?.price.toFixed(2) ?? '—'}</span>
                            <span className={`sc-pct ${chg >= 0 ? 'up' : 'down'}`}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</span>
                            <button className="btn-unsub" onClick={() => unsubscribe(t)}>Remove</button>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {pageType === 'settings' && (
            <div style={{ maxWidth: 520 }}>
              <div className="market-summary" style={{ paddingBottom: 24 }}>
                <div className="market-summary-title">Preferences</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Theme Mode</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Toggle between light and dark mode</div>
                  </div>
                  <button className="icon-btn" style={{ border: '1px solid var(--border)', width: 'auto', padding: '0 12px' }} onClick={toggleTheme}>
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Notifications</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enable/disable volatility alerts</div>
                  </div>
                  <button className="btn-subscribe" style={{ background: 'var(--green)', color: '#fff', border: 'none' }}>Enabled</button>
                </div>
              </div>
            </div>
          )}

          {/* ── ADMIN DASHBOARD ── */}
          {pageType === 'admin' && adminStats && (
            <div style={{ maxWidth: 800 }}>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon blue">👥</div>
                  <div className="stat-info"><label>Total Users</label><div className="stat-value">{adminStats.totalUsers}</div></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">🟢</div>
                  <div className="stat-info"><label>Active Sockets</label><div className="stat-value">{adminStats.activeUsers}</div></div>
                </div>
              </div>

              <div className="market-summary" style={{ marginTop: 20 }}>
                <div className="market-summary-title">Market Engine Control</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: adminStats.feedActive ? 'var(--green)' : 'var(--red)' }}>
                      {adminStats.feedActive ? '🟢 Live Feed is RUNNING' : '🔴 Live Feed is STOPPED'}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                      Toggle this to start or stop the random walk price generator for all connected users.
                    </p>
                  </div>
                  <button 
                    onClick={toggleFeed} 
                    style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 700, background: adminStats.feedActive ? 'var(--red)' : 'var(--green)', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    {adminStats.feedActive ? 'Stop Market Feed' : 'Start Market Feed'}
                  </button>
                </div>
              </div>

              <div className="market-summary" style={{ marginTop: 20 }}>
                <div className="market-summary-title">Subscription Analytics</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {Object.entries(adminStats.subscriptionAnalytics).sort((a, b) => b[1] - a[1]).map(([t, count]) => (
                      <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--card-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700 }}>{t}</span>
                        <span className="accent" style={{ fontWeight: 600 }}>{count} Users</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px' }}>
                    <SubscriptionAnalyticsChart subscriptionAnalytics={adminStats.subscriptionAnalytics} />
                  </div>
                </div>
              </div>

              <div className="market-summary" style={{ marginTop: 20 }}>
                <div className="market-summary-title">Real-Time System Diagnostics</div>
                <SystemMetrics adminStats={adminStats} dbConnected={true} />
              </div>
            </div>
          )}
        </div>
      </div>

      <ToastContainer notifications={notifications} />
    </div>
  );
}
export default Dashboard;
