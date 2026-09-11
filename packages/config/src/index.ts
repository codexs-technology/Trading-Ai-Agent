import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEMO_MODE: z.string().transform(v => v === 'true').default('true'),

  // Frontend
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_WS_URL: z.string().url().default('ws://localhost:4000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Codex Trading'),
  NEXT_PUBLIC_APP_TAGLINE: z.string().default('Intelligent Crypto Trading. Simplified.'),

  // Backend
  PORT: z.string().transform(Number).default('4000'),
  API_URL: z.string().url().default('http://localhost:4000'),
  WS_PORT: z.string().transform(Number).default('4000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5.6'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // CORS
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  // Demo Credentials
  DEMO_USER_EMAIL: z.string().email().default('demo@codextrading.local'),
  DEMO_USER_PASSWORD: z.string().default('DemoPass123!'),
  ADMIN_USER_EMAIL: z.string().email().default('admin@codextrading.local'),
  ADMIN_USER_PASSWORD: z.string().default('AdminPass123!'),

  // Market Simulator
  MARKET_TICK_INTERVAL_MS: z.string().transform(Number).default('1000'),
  MARKET_VOLATILITY: z.string().transform(Number).default('0.02'),
  MARKET_TREND: z.enum(['bullish', 'bearish', 'neutral', 'volatile']).default('neutral'),
  MARKET_VOLUME_MULTIPLIER: z.string().transform(Number).default('1.0'),
  MARKET_SPREAD_BPS: z.string().transform(Number).default('5'),

  // Trading Fees
  MAKER_FEE_BPS: z.string().transform(Number).default('10'),
  TAKER_FEE_BPS: z.string().transform(Number).default('10'),

  // Risk Engine
  MAX_RISK_PER_TRADE_PCT: z.string().transform(Number).default('2'),
  MAX_PORTFOLIO_CONCENTRATION_PCT: z.string().transform(Number).default('20'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export const env = getEnv();

export const tradingPairs = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'BNB/USDT',
  'XRP/USDT',
  'DOGE/USDT',
  'ADA/USDT',
] as const;

export type TradingPair = typeof tradingPairs[number];

export const candleIntervals = ['1m', '5m', '15m', '1h', '4h', '1D'] as const;
export type CandleInterval = typeof candleIntervals[number];

export const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;
export type Timeframe = typeof timeframes[number];

export const defaultMakerFeeBps = 10;
export const defaultTakerFeeBps = 10;