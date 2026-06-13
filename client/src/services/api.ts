import { API_BASE } from './socket';
import type { StockMap } from '../types';

export async function loginUser(email: string): Promise<{
  token: string;
  email: string;
  subscriptions: string[];
  supportedStocks: string[];
  stockMeta: Record<string, { company: string; sector: string; basePrice: number }>;
  currentPrices: StockMap;
  isAdmin?: boolean;
  balance?: number;
  portfolio?: Record<string, number>;
}> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}
