import { z } from 'zod';

export const AdminActionSchema = z.object({
  id: z.string().uuid(),
  adminId: z.string().uuid(),
  action: z.string(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});
export type AdminAction = z.infer<typeof AdminActionSchema>;

export const SystemSettingSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.unknown(),
  category: z.string(),
  isPublic: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SystemSetting = z.infer<typeof SystemSettingSchema>;

export const DashboardStatsSchema = z.object({
  totalUsers: z.number().int(),
  activeUsers: z.number().int(),
  volume24h: z.number(),
  openOrders: z.number().int(),
  tradesToday: z.number().int(),
  simulatedAssets: z.number(),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const HealthStatusSchema = z.object({
  api: z.enum(['operational', 'degraded', 'down']),
  database: z.enum(['connected', 'disconnected']),
  websocket: z.enum(['connected', 'disconnected']),
  marketSimulator: z.enum(['running', 'stopped']),
  aiService: z.enum(['configured', 'not_configured', 'error']),
});
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const DemoControlActionSchema = z.enum([
  'RESET_DEMO_ACCOUNT',
  'GENERATE_TRADING_HISTORY',
  'GENERATE_WINNING_TRADES',
  'GENERATE_LOSING_TRADES',
  'SET_DEMO_BALANCE',
  'GENERATE_PORTFOLIO_HISTORY',
  'TRIGGER_MARKET_MOVEMENT',
]);
export type DemoControlAction = z.infer<typeof DemoControlActionSchema>;