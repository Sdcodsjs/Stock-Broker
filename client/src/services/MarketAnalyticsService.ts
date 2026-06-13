import type { StockMap } from '../types';

export interface MarketStats {
  topGainer: { ticker: string; changePercent: number; price: number } | null;
  topLoser: { ticker: string; changePercent: number; price: number } | null;
  averageMarketChange: number;
  bullishCount: number;
  bearishCount: number;
  marketVolatility: number; // calculated standard deviation of changes
  mostPopularStock: string;
}

export class MarketAnalyticsService {
  /**
   * Calculate market analytics from a StockMap and subscription frequencies
   */
  static calculateStats(
    stocks: StockMap, 
    supportedStocks: string[],
    subscriptionAnalytics?: Record<string, number>
  ): MarketStats {
    let topGainer: { ticker: string; changePercent: number; price: number } | null = null;
    let topLoser: { ticker: string; changePercent: number; price: number } | null = null;
    let totalChange = 0;
    let bullishCount = 0;
    let bearishCount = 0;
    const changes: number[] = [];

    supportedStocks.forEach(ticker => {
      const data = stocks[ticker];
      if (!data) return;

      const change = data.price - data.prevPrice;
      const changePercent = data.prevPrice ? (change / data.prevPrice) * 100 : 0;
      changes.push(changePercent);
      totalChange += changePercent;

      if (changePercent > 0) {
        bullishCount++;
      } else {
        bearishCount++;
      }

      if (!topGainer || changePercent > topGainer.changePercent) {
        topGainer = { ticker, changePercent, price: data.price };
      }
      if (!topLoser || changePercent < topLoser.changePercent) {
        topLoser = { ticker, changePercent, price: data.price };
      }
    });

    const count = supportedStocks.length || 1;
    const averageMarketChange = totalChange / count;

    // Standard deviation for volatility index
    const mean = averageMarketChange;
    const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const marketVolatility = Math.sqrt(variance);

    // Find most popular stock based on admin subscription data or local watchers
    let mostPopularStock = 'N/A';
    if (subscriptionAnalytics) {
      let maxCount = -1;
      Object.entries(subscriptionAnalytics).forEach(([ticker, subCount]) => {
        if (subCount > maxCount) {
          maxCount = subCount;
          mostPopularStock = ticker;
        }
      });
    }

    return {
      topGainer,
      topLoser,
      averageMarketChange,
      bullishCount,
      bearishCount,
      marketVolatility,
      mostPopularStock,
    };
  }
}
