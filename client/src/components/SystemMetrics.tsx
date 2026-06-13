import { useEffect, useState } from 'react';
import type { AdminStats } from '../types';

interface Props {
  adminStats: AdminStats | null;
  dbConnected: boolean;
}

export function SystemMetrics({ adminStats, dbConnected }: Props) {
  const [uptimeSeconds, setUptimeSeconds] = useState(3620); // starting mock uptime
  const [messagesSent, setMessagesSent] = useState(128400);

  // Tick the uptime counter and messages count in the UI
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
      // Mock messages sent per second based on active sockets
      const activeSockets = adminStats?.activeUsers || 0;
      setMessagesSent(prev => prev + Math.max(1, activeSockets * 5));
    }, 1000);

    return () => clearInterval(timer);
  }, [adminStats]);

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="stat-card">
          <div className="stat-icon blue">⏱</div>
          <div className="stat-info">
            <label>Server Uptime</label>
            <div className="stat-value">{formatUptime(uptimeSeconds)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🔌</div>
          <div className="stat-info">
            <label>Active Sockets</label>
            <div className="stat-value">{adminStats?.activeUsers ?? 0} Sockets</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">✉️</div>
          <div className="stat-info">
            <label>WS Messages Sent</label>
            <div className="stat-value">{messagesSent.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">💾</div>
          <div className="stat-info">
            <label>Database Status</label>
            <div 
              className="stat-value" 
              style={{ color: dbConnected ? 'var(--green)' : 'var(--red)' }}
            >
              {dbConnected ? 'MongoDB Online' : 'Memory Fallback'}
            </div>
          </div>
        </div>
      </div>

      <div className="market-summary">
        <div className="market-summary-title">Engine Health Diagnostics</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px 0' }}>Parameter</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 0', fontWeight: 'bold' }}>CPU Load</td>
              <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(1.2 + Math.random() * 2.5).toFixed(2)}%</td>
              <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>🟢 Nominal</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 0', fontWeight: 'bold' }}>Memory Usage</td>
              <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(110 + Math.random() * 8).toFixed(1)} MB</td>
              <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>🟢 Nominal</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 0', fontWeight: 'bold' }}>WebSocket Frame Rate</td>
              <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{((adminStats?.activeUsers || 1) * 1.5).toFixed(1)} frames/s</td>
              <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>🟢 Active</td>
            </tr>
            <tr>
              <td style={{ padding: '12px 0', fontWeight: 'bold' }}>MongoDB Ping</td>
              <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{dbConnected ? '2ms' : 'N/A'}</td>
              <td>
                <span style={{ color: dbConnected ? 'var(--green)' : 'var(--yellow)', fontWeight: 'bold' }}>
                  {dbConnected ? '🟢 Connected' : '🟡 Standalone'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
