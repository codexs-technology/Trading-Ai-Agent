import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
  'ORDER_FILLED',
  'ORDER_CANCELLED',
  'ORDER_REJECTED',
  'PRICE_ALERT',
  'SECURITY_EVENT',
  'SYSTEM_ANNOUNCEMENT',
  'DEPOSIT_CONFIRMED',
  'WITHDRAWAL_PROCESSED',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  isRead: z.boolean(),
  createdAt: z.date(),
  readAt: z.date().optional(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const PriceAlertConditionSchema = z.enum([
  'PRICE_ABOVE',
  'PRICE_BELOW',
  'PRICE_CHANGE_PCT_ABOVE',
  'PRICE_CHANGE_PCT_BELOW',
  'VOLUME_ABOVE',
]);
export type PriceAlertCondition = z.infer<typeof PriceAlertConditionSchema>;

export const PriceAlertSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: z.string(),
  condition: PriceAlertConditionSchema,
  targetValue: z.number(),
  isActive: z.boolean(),
  triggeredAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PriceAlert = z.infer<typeof PriceAlertSchema>;

export const CreatePriceAlertInputSchema = z.object({
  symbol: z.string(),
  condition: PriceAlertConditionSchema,
  targetValue: z.number(),
});
export type CreatePriceAlertInput = z.infer<typeof CreatePriceAlertInputSchema>;

export const WatchlistItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: z.string(),
  createdAt: z.date(),
});
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;