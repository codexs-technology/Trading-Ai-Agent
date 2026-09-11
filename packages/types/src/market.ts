import { z } from 'zod';

export const TradingPairSchema = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  basePrecision: z.number().int(),
  quotePrecision: z.number().int(),
  minOrderSize: z.number(),
  maxOrderSize: z.number(),
  tickSize: z.number(),
  makerFeeBps: z.number().int(),
  takerFeeBps: z.number().int(),
  isActive: z.boolean(),
  isDemo: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TradingPair = z.infer<typeof TradingPairSchema>;

export const MarketSnapshotSchema = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  price: z.number(),
  bid: z.number(),
  ask: z.number(),
  high24h: z.number(),
  low24h: z.number(),
  volume24h: z.number(),
  change24h: z.number(),
  changePct24h: z.number(),
  timestamp: z.date(),
});
export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;

export const CandleSchema = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  interval: z.string(),
  timestamp: z.date(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  createdAt: z.date(),
});
export type Candle = z.infer<typeof CandleSchema>;

export const OrderBookLevelSchema = z.object({
  price: z.number(),
  quantity: z.number(),
  total: z.number(),
});
export type OrderBookLevel = z.infer<typeof OrderBookLevelSchema>;

export const OrderBookSchema = z.object({
  symbol: z.string(),
  asks: z.array(OrderBookLevelSchema),
  bids: z.array(OrderBookLevelSchema),
  spread: z.number(),
  timestamp: z.date(),
});
export type OrderBook = z.infer<typeof OrderBookSchema>;

export const RecentTradeSchema = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  price: z.number(),
  quantity: z.number(),
  side: z.enum(['BUY', 'SELL']),
  timestamp: z.date(),
});
export type RecentTrade = z.infer<typeof RecentTradeSchema>;

export const TickerDataSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  bid: z.number(),
  ask: z.number(),
  high24h: z.number(),
  low24h: z.number(),
  volume24h: z.number(),
  change24h: z.number(),
  changePct24h: z.number(),
  timestamp: z.date(),
});
export type TickerData = z.infer<typeof TickerDataSchema>;

export const MarketSimulatorConfigSchema = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  volatility: z.number(),
  trend: z.enum(['bullish', 'bearish', 'neutral', 'volatile']),
  tickIntervalMs: z.number().int(),
  volumeMultiplier: z.number(),
  spreadBps: z.number().int(),
  isRunning: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MarketSimulatorConfig = z.infer<typeof MarketSimulatorConfigSchema>;

export const CandleIntervalSchema = z.enum(['1m', '5m', '15m', '1h', '4h', '1D']);
export type CandleInterval = z.infer<typeof CandleIntervalSchema>;

export const TimeframeSchema = z.enum(['1D', '1W', '1M', '3M', '1Y', 'ALL']);
export type Timeframe = z.infer<typeof TimeframeSchema>;