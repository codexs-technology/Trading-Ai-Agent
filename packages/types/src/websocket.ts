import { z } from 'zod';

export const WSChannelSchema = z.enum([
  'market:ticker',
  'market:candle',
  'market:orderbook',
  'market:trade',
  'order:updated',
  'portfolio:updated',
  'notification:new',
  'alert:triggered',
]);
export type WSChannel = z.infer<typeof WSChannelSchema>;

export const WSSubscribeMessageSchema = z.object({
  type: z.literal('subscribe'),
  channels: z.array(WSChannelSchema),
  symbols: z.array(z.string()).optional(),
});
export type WSSubscribeMessage = z.infer<typeof WSSubscribeMessageSchema>;

export const WSUnsubscribeMessageSchema = z.object({
  type: z.literal('unsubscribe'),
  channels: z.array(WSChannelSchema),
  symbols: z.array(z.string()).optional(),
});
export type WSUnsubscribeMessage = z.infer<typeof WSUnsubscribeMessageSchema>;

export const WSAuthMessageSchema = z.object({
  type: z.literal('auth'),
  token: z.string(),
});
export type WSAuthMessage = z.infer<typeof WSAuthMessageSchema>;

export const WSPingMessageSchema = z.object({
  type: z.literal('ping'),
});
export type WSPingMessage = z.infer<typeof WSPingMessageSchema>;

export const WSPongMessageSchema = z.object({
  type: z.literal('pong'),
  timestamp: z.number(),
});
export type WSPongMessage = z.infer<typeof WSPongMessageSchema>;

export const WSErrorMessageSchema = z.object({
  type: z.literal('error'),
  code: z.string(),
  message: z.string(),
});
export type WSErrorMessage = z.infer<typeof WSErrorMessageSchema>;

export const WSMessageSchema = z.union([
  WSSubscribeMessageSchema,
  WSUnsubscribeMessageSchema,
  WSAuthMessageSchema,
  WSPingMessageSchema,
  WSPongMessageSchema,
  WSErrorMessageSchema,
]);
export type WSMessage = z.infer<typeof WSMessageSchema>;

export const WSEventBaseSchema = z.object({
  channel: WSChannelSchema,
  timestamp: z.number(),
});

export const MarketTickerEventSchema = WSEventBaseSchema.extend({
  channel: z.literal('market:ticker'),
  data: z.object({
    symbol: z.string(),
    price: z.number(),
    bid: z.number(),
    ask: z.number(),
    high24h: z.number(),
    low24h: z.number(),
    volume24h: z.number(),
    change24h: z.number(),
    changePct24h: z.number(),
  }),
});
export type MarketTickerEvent = z.infer<typeof MarketTickerEventSchema>;

export const MarketCandleEventSchema = WSEventBaseSchema.extend({
  channel: z.literal('market:candle'),
  data: z.object({
    symbol: z.string(),
    interval: z.string(),
    open: z.number(),
    high: z.number(),
    low: z.number(),
    close: z.number(),
    volume: z.number(),
    timestamp: z.number(),
    isClosed: z.boolean(),
  }),
});
export type MarketCandleEvent = z.infer<typeof MarketCandleEventSchema>;

export const MarketOrderBookEventSchema = WSEventBaseSchema.extend({
  channel: z.literal('market:orderbook'),
  data: z.object({
    symbol: z.string(),
    asks: z.array(z.object({ price: z.number(), quantity: z.number() })),
    bids: z.array(z.object({ price: z.number(), quantity: z.number() })),
    spread: z.number(),
  }),
});
export type MarketOrderBookEvent = z.infer<typeof MarketOrderBookEventSchema>;

export const MarketTradeEventSchema = WSEventBaseSchema.extend({
  channel: z.literal('market:trade'),
  data: z.object({
    symbol: z.string(),
    price: z.number(),
    quantity: z.number(),
    side: z.enum(['BUY', 'SELL']),
    timestamp: z.number(),
  }),
});
export type MarketTradeEvent = z.infer<typeof MarketTradeEventSchema>;

export const OrderUpdatedEventSchema = WSEventBaseSchema.extend({
  channel: z.literal('order:updated'),
  data: z.object({
    orderId: z.string().uuid(),
    symbol: z.string(),
    side: z.enum(['BUY', 'SELL']),
    type: z.enum(['MARKET', 'LIMIT']),
    status: z.enum(['OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED']),
    price: z.number().optional(),
    quantity: z.number(),
    filledQty: z.number(),
    remainingQty: z.number(),
    fee: z.number(),
  }),
});
export type OrderUpdatedEvent = z.infer<typeof OrderUpdatedEventSchema>;

export const PortfolioUpdatedEventSchema = WSEventBaseSchema.extend({
  channel: z.literal('portfolio:updated'),
  data: z.object({
    totalValue: z.number(),
    dailyPnl: z.number(),
    totalPnl: z.number(),
    balances: z.array(z.object({
      asset: z.string(),
      free: z.number(),
      locked: z.number(),
      value: z.number(),
    })),
  }),
});
export type PortfolioUpdatedEvent = z.infer<typeof PortfolioUpdatedEventSchema>;

export const NotificationEventSchema = WSEventBaseSchema.extend({
  channel: z.literal('notification:new'),
  data: z.object({
    id: z.string().uuid(),
    type: z.enum([
      'ORDER_FILLED',
      'ORDER_CANCELLED',
      'ORDER_REJECTED',
      'PRICE_ALERT',
      'SECURITY_EVENT',
      'SYSTEM_ANNOUNCEMENT',
      'DEPOSIT_CONFIRMED',
      'WITHDRAWAL_PROCESSED',
    ]),
    title: z.string(),
    message: z.string(),
  }),
});
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;

export const AlertTriggeredEventSchema = WSEventBaseSchema.extend({
  channel: z.literal('alert:triggered'),
  data: z.object({
    alertId: z.string().uuid(),
    symbol: z.string(),
    condition: z.enum([
      'PRICE_ABOVE',
      'PRICE_BELOW',
      'PRICE_CHANGE_PCT_ABOVE',
      'PRICE_CHANGE_PCT_BELOW',
      'VOLUME_ABOVE',
    ]),
    targetValue: z.number(),
    currentValue: z.number(),
  }),
});
export type AlertTriggeredEvent = z.infer<typeof AlertTriggeredEventSchema>;

export const WSEventSchema = z.union([
  MarketTickerEventSchema,
  MarketCandleEventSchema,
  MarketOrderBookEventSchema,
  MarketTradeEventSchema,
  OrderUpdatedEventSchema,
  PortfolioUpdatedEventSchema,
  NotificationEventSchema,
  AlertTriggeredEventSchema,
]);
export type WSEvent = z.infer<typeof WSEventSchema>;