import type { Notification } from '../types';

interface Props {
  notifications: Notification[];
  onClose: () => void;
  onClearAll: () => void;
}

export function NotificationPanel({ notifications, onClose, onClearAll }: Props) {
  const fmt = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString(); } catch { return ''; }
  };

  return (
    <div className="notif-panel">
      <div className="notif-header">
        <h3>🔔 Alerts ({notifications.filter(n => !n.read).length} new)</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-clear" onClick={onClearAll}>Clear all</button>
          <button className="btn-clear" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="notif-list">
        {notifications.length === 0
          ? <div className="notif-empty">No alerts yet</div>
          : notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                <div className={`notif-dot ${n.type}`} />
                <div>
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{fmt(n.timestamp)}</div>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
