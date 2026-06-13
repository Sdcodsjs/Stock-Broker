import { create } from 'zustand';
import type { User, StockMap, Notification, ActivityLog, Theme } from '../types';

interface TradeStore {
  user: User | null;
  supportedStocks: string[];
  stockMeta: Record<string, { company: string; sector: string }>;
  stocks: StockMap;
  marketPrices: StockMap;
  priceHistory: Record<string, number[]>;
  subscriptions: string[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  balance: number;
  portfolio: Record<string, number>;
  theme: Theme;
  buyQty: Record<string, string>;

  setUser: (user: User | null) => void;
  setSession: (
    user: User, 
    supportedStocks: string[], 
    stockMeta: Record<string, { company: string; sector: string }>, 
    balance: number, 
    portfolio: Record<string, number>, 
    subscriptions: string[], 
    stocks: StockMap
  ) => void;
  updateStocks: (data: StockMap) => void;
  updateStockUpdate: (data: StockMap) => void;
  updateMarketSnapshot: (data: StockMap) => void;
  setPriceHistory: (history: Record<string, number[]>) => void;
  setSubscriptions: (subs: string[]) => void;
  addNotification: (n: Notification) => void;
  setNotifications: (list: Notification[]) => void;
  addActivity: (log: ActivityLog) => void;
  setActivityLogs: (list: ActivityLog[]) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setBuyQty: (ticker: string, qty: string) => void;
  clearBuyQty: (ticker: string) => void;
  updatePortfolio: (balance: number, portfolio: Record<string, number>) => void;
  logout: () => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  user: null,
  supportedStocks: [],
  stockMeta: {},
  stocks: {},
  marketPrices: {},
  priceHistory: {},
  subscriptions: [],
  notifications: [],
  activityLogs: [],
  balance: 100000,
  portfolio: {},
  theme: 'dark',
  buyQty: {},

  setUser: (user) => set({ user }),
  
  setSession: (user, supportedStocks, stockMeta, balance, portfolio, subscriptions, stocks) => set({
    user,
    supportedStocks,
    stockMeta,
    balance,
    portfolio,
    subscriptions,
    stocks,
    marketPrices: stocks,
  }),

  updateStocks: (data) => set((state) => ({
    stocks: { ...state.stocks, ...data }
  })),

  updateStockUpdate: (data) => set((state) => ({
    stocks: { ...state.stocks, ...data }
  })),

  updateMarketSnapshot: (data) => set({
    marketPrices: data
  }),

  setPriceHistory: (history) => set({
    priceHistory: history
  }),

  setSubscriptions: (subs) => set({
    subscriptions: subs
  }),

  addNotification: (n) => set((state) => ({
    notifications: [n, ...state.notifications].slice(0, 30)
  })),

  setNotifications: (list) => set({
    notifications: list.slice(0, 30)
  }),

  addActivity: (log) => set((state) => ({
    activityLogs: [log, ...state.activityLogs].slice(0, 50)
  })),

  setActivityLogs: (list) => set({
    activityLogs: list.slice(0, 50)
  }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    return { theme: nextTheme };
  }),

  setBuyQty: (ticker, qty) => set((state) => ({
    buyQty: { ...state.buyQty, [ticker]: qty }
  })),

  clearBuyQty: (ticker) => set((state) => ({
    buyQty: { ...state.buyQty, [ticker]: '' }
  })),

  updatePortfolio: (balance, portfolio) => set({
    balance,
    portfolio
  }),

  logout: () => set({
    user: null,
    subscriptions: [],
    notifications: [],
    activityLogs: [],
    portfolio: {},
    balance: 100000,
    buyQty: {},
  }),
}));
