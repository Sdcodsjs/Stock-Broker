import type { ActivityLog } from '../types';

interface Props { logs: ActivityLog[]; }

const ICONS: Record<string, string> = {
  login: '🔑', logout: '🚪', subscribe: '📈', unsubscribe: '📉',
};

export function ActivityLogPanel({ logs }: Props) {
  if (!logs.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No activity yet</h3>
        <p>Your actions will appear here</p>
      </div>
    );
  }
  return (
    <div className="activity-list">
      {logs.map(l => (
        <div key={l.id} className="activity-item">
          <div className={`activity-icon ${l.action}`}>{ICONS[l.action] ?? '•'}</div>
          <div>
            <div className="activity-action">{l.action}</div>
            <div className="activity-detail">{l.detail}</div>
          </div>
          <span className="activity-time">{new Date(l.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}
