import { z } from 'zod';

export const AIMessageRoleSchema = z.enum(['USER', 'ASSISTANT', 'SYSTEM', 'TOOL']);
export type AIMessageRole = z.infer<typeof AIMessageRoleSchema>;

export const AIMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: AIMessageRoleSchema,
  content: z.string(),
  toolCalls: z.array(z.object({
    id: z.string(),
    name: z.string(),
    arguments: z.record(z.unknown()),
  })).optional(),
  toolResults: z.array(z.object({
    toolCallId: z.string(),
    name: z.string(),
    result: z.unknown(),
  })).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});
export type AIMessage = z.infer<typeof AIMessageSchema>;

export const AIConversationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AIConversation = z.infer<typeof AIConversationSchema>;

export const AIToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()),
});
export type AITool = z.infer<typeof AIToolSchema>;

export const AIAnalysisSchema = z.object({
  symbol: z.string(),
  marketBias: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']),
  confidence: z.number().min(0).max(100),
  risk: z.enum(['LOW', 'MODERATE', 'HIGH']),
  support: z.number(),
  resistance: z.number(),
  analysis: z.string(),
  indicators: z.record(z.unknown()).optional(),
  timestamp: z.date(),
});
export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;

export const AskAIInputSchema = z.object({
  message: z.string(),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    symbol: z.string().optional(),
    includePortfolio: z.boolean().optional(),
    includeMarketData: z.boolean().optional(),
  }).optional(),
});
export type AskAIInput = z.infer<typeof AskAIInputSchema>;

export const AIToolNames = {
  GET_MARKET_DATA: 'getMarketData',
  GET_ORDER_BOOK: 'getOrderBook',
  GET_INDICATORS: 'getIndicators',
  GET_PORTFOLIO: 'getPortfolio',
  GET_TRADE_HISTORY: 'getTradeHistory',
  GET_OPEN_ORDERS: 'getOpenOrders',
  CALCULATE_RISK_METRICS: 'calculateRiskMetrics',
} as const;

export type AIToolName = typeof AIToolNames[keyof typeof AIToolNames];