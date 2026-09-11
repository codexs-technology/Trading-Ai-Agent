import { z } from 'zod';

export const PortfolioSnapshotSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  totalValue: z.number(),
  totalPnl: z.number(),
  dailyPnl: z.number(),
  unrealizedPnl: z.number(),
  realizedPnl: z.number(),
  winRate: z.number().optional(),
  totalTrades: z.number().int(),
  winningTrades: z.number().int(),
  losingTrades: z.number().int(),
  timestamp: z.date(),
});
export type PortfolioSnapshot = z.infer<typeof PortfolioSnapshotSchema>;

export const PortfolioSummarySchema = z.object({
  totalBalance: z.number(),
  todayPnl: z.number(),
  todayPnlPct: z.number(),
  totalPnl: z.number(),
  totalPnlPct: z.number(),
  winRate: z.number(),
  totalTrades: z.number(),
  bestTrade: z.number().optional(),
  worstTrade: z.number().optional(),
  assetAllocation: z.array(z.object({
    asset: z.string(),
    value: z.number(),
    percentage: z.number(),
  })),
});
export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;

export const PnlBreakdownSchema = z.object({
  realized: z.number(),
  unrealized: z.number(),
  daily: z.number(),
  total: z.number(),
  totalPct: z.number(),
});
export type PnlBreakdown = z.infer<typeof PnlBreakdownSchema>;

export const TimeframeSchema = z.enum(['1D', '1W', '1M', '3M', '1Y', 'ALL']);
export type Timeframe = z.infer<typeof TimeframeSchema>;

export const PortfolioChartPointSchema = z.object({
  timestamp: z.date(),
  value: z.number(),
  pnl: z.number(),
});
export type PortfolioChartPoint = z.infer<typeof PortfolioChartPointSchema>;