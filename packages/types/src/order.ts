import { z } from 'zod';

export const OrderSideSchema = z.enum(['BUY', 'SELL']);
export type OrderSide = z.infer<typeof OrderSideSchema>;

export const OrderTypeSchema = z.enum(['MARKET', 'LIMIT']);
export type OrderType = z.infer<typeof OrderTypeSchema>;

export const OrderStatusSchema = z.enum(['OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: z.string(),
  side: OrderSideSchema,
  type: OrderTypeSchema,
  status: OrderStatusSchema,
  price: z.number().optional(),
  quantity: z.number(),
  filledQty: z.number(),
  remainingQty: z.number(),
  fee: z.number(),
  feeAsset: z.string().optional(),
  avgFillPrice: z.number().optional(),
  clientOrderId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  filledAt: z.date().optional(),
  cancelledAt: z.date().optional(),
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderInputSchema = z.object({
  symbol: z.string(),
  side: OrderSideSchema,
  type: OrderTypeSchema,
  price: z.number().optional(),
  quantity: z.number().positive(),
}).refine(data => {
  if (data.type === 'LIMIT' && data.price === undefined) {
    return false;
  }
  return true;
}, {
  message: 'Limit orders require a price',
  path: ['price'],
});
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const CancelOrderInputSchema = z.object({
  orderId: z.string().uuid(),
});
export type CancelOrderInput = z.infer<typeof CancelOrderInputSchema>;

export const TradeSideSchema = z.enum(['BUY', 'SELL']);
export type TradeSide = z.infer<typeof TradeSideSchema>;

export const TradeSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: z.string(),
  side: TradeSideSchema,
  price: z.number(),
  quantity: z.number(),
  fee: z.number(),
  feeAsset: z.string(),
  isMaker: z.boolean(),
  createdAt: z.date(),
});
export type Trade = z.infer<typeof TradeSchema>;

export const OrderBookUpdateSchema = z.object({
  symbol: z.string(),
  asks: z.array(z.object({
    price: z.number(),
    quantity: z.number(),
  })),
  bids: z.array(z.object({
    price: z.number(),
    quantity: z.number(),
  })),
  timestamp: z.date(),
});
export type OrderBookUpdate = z.infer<typeof OrderBookUpdateSchema>;