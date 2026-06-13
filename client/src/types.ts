export interface StockData {
  price: number;
  prevPrice: number;
  openPrice: number;
  high: number;
  low: number;
  company: string;
  sector: string;
  updatedAt: string;
}

export type StockMap = Record<string, StockData>;

export interface StockMeta {
  company: string;
  sector: string;
  basePrice: number;
}

export interface User {
  email: string;
  token: string;
  subscriptions: string[];
  isAdmin?: boolean;
  balance?: number;
  portfolio?: Record<string, number>;
}

export interface ActivityLog {
  id: number;
  action: 'login' | 'logout' | 'subscribe' | 'unsubscribe' | 'buy' | 'sell';
  detail: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  ticker: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  subscriptionAnalytics: Record<string, number>;
  feedActive: boolean;
}

export type Theme = 'dark' | 'light';
