import { useEffect, useState } from 'react';
import type { Notification } from '../types';

interface Toast { id: number; notif: Notification; exiting: boolean; }

interface Props { notifications: Notification[]; }

export function ToastContainer({ notifications }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = new Set<number>();

  useEffect(() => {
    if (!notifications.length) return;
    const latest = notifications[0];
    if (seen.has(latest.id)) return;
    seen.add(latest.id);

    const toast: Toast = { id: Date.now(), notif: latest, exiting: false };
    setToasts(prev => [toast, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === toast.id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 350);
    }, 4000);
  }, [notifications]);

  const icons: Record<string, string> = { success: '▲', warning: '▼', info: 'ℹ' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.notif.type} ${t.exiting ? 'exit' : ''}`}>
          <span className="toast-icon">{icons[t.notif.type] ?? 'ℹ'}</span>
          <div className="toast-body">
            <div className="toast-title">{t.notif.ticker} Alert</div>
            <div className="toast-msg">{t.notif.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
