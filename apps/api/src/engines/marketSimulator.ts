import { prisma } from '@codex-trading/database';
import { config } from '../config/index';
import { emitToSymbol, broadcast } from '../websocket';

interface SimulatorState {
  symbol: string;
  price: number;
  previousPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  changePct24h: number;
  volatility: number;
  trend: string;
  tickIntervalMs: number;
  volumeMultiplier: number;
  spreadBps: number;
  lastTick: number;
}

const simulatorStates = new Map<string, SimulatorState>();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateNextPrice(state: SimulatorState): number {
  const volatility = state.volatility;
  const trend = state.trend;

  let drift = 0;
  switch (trend) {
    case 'bullish':
      drift = volatility * 0.3;
      break;
    case 'bearish':
      drift = -volatility * 0.3;
      break;
    case 'volatile':
      drift = (Math.random() - 0.5) * volatility;
      break;
    default:
      drift = (Math.random() - 0.5) * volatility * 0.5;
  }

  const shock = (Math.random() - 0.5) * 2 * volatility;
  const change = drift + shock;

  const newPrice = state.price * (1 + change);
  return clamp(newPrice, state.low24h * 0.95, state.high24h * 1.05);
}

function update24hStats(state: SimulatorState, newPrice: number): void {
  state.previousPrice = state.price;
  state.price = newPrice;

  if (newPrice > state.high24h) {
    state.high24h = newPrice;
  }
  if (newPrice < state.low24h) {
    state.low24h = newPrice;
  }

  state.volume24h += Math.random() * 10 * state.volumeMultiplier;
  state.change24h = state.price - state.high24h * 0.99;
  state.changePct24h = (state.change24h / (state.high24h * 0.99)) * 100;
}

async function persistSnapshot(state: SimulatorState): Promise<void> {
  const bid = state.price * (1 - state.spreadBps / 20000);
  const ask = state.price * (1 + state.spreadBps / 20000);

  await prisma.marketSnapshot.create({
    data: {
      symbol: state.symbol,
      price: state.price,
      bid,
      ask,
      high24h: state.high24h,
      low24h: state.low24h,
      volume24h: state.volume24h,
      change24h: state.change24h,
      changePct24h: state.changePct24h,
    },
  });

  const pair = await prisma.tradingPair.findUnique({
    where: { symbol: state.symbol },
  });

  if (pair) {
    await prisma.simulatorConfigs.update({
      where: { symbol: state.symbol },
      data: {
        volatility: state.volatility,
        trend: state.trend,
        volumeMultiplier: state.volumeMultiplier,
        spreadBps: state.spreadBps,
      },
    });
  }
}

async function tick(state: SimulatorState): Promise<void> {
  const newPrice = generateNextPrice(state);
  update24hStats(state, newPrice);

  await persistSnapshot(state);

  const tickerData = {
    symbol: state.symbol,
    price: state.price,
    bid: state.price * (1 - state.spreadBps / 20000),
    ask: state.price * (1 + state.spreadBps / 20000),
    high24h: state.high24h,
    low24h: state.low24h,
    volume24h: state.volume24h,
    change24h: state.change24h,
    changePct24h: state.changePct24h,
    timestamp: Date.now(),
  };

  emitToSymbol(state.symbol, 'market:ticker', tickerData);
  broadcast('market:ticker', tickerData);

  // Occasionally generate a trade
  if (Math.random() < 0.3) {
    const tradeData = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: state.symbol,
      price: state.price,
      quantity: Math.random() * 5 * state.volumeMultiplier,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL' as const,
      timestamp: Date.now(),
    };

    emitToSymbol(state.symbol, 'market:trade', tradeData);

    await prisma.trade.create({
      data: {
        orderId: `simulator_${Date.now()}`,
        userId: 'system',
        symbol: state.symbol,
        side: tradeData.side,
        price: tradeData.price,
        quantity: tradeData.quantity,
        fee: 0,
        feeAsset: state.symbol.split('/')[1],
        isMaker: Math.random() > 0.5,
      },
    });
  }
}

async function initializeSimulator(symbol: string): Promise<void> {
  const pair = await prisma.tradingPair.findUnique({
    where: { symbol },
    include: { simulatorConfigs: true },
  });

  if (!pair) {
    console.warn(`Trading pair ${symbol} not found`);
    return;
  }

  const config = pair.simulatorConfigs;

  const basePrices: Record<string, number> = {
    'BTC/USDT': 67482.21,
    'ETH/USDT': 3421.56,
    'SOL/USDT': 142.34,
    'BNB/USDT': 567.89,
    'XRP/USDT': 0.5234,
    'DOGE/USDT': 0.1234,
    'ADA/USDT': 0.4567,
  };

  const basePrice = basePrices[symbol] || 100;
  const existingSnapshot = await prisma.marketSnapshot.findFirst({
    where: { symbol },
    orderBy: { timestamp: 'desc' },
  });

  const state: SimulatorState = {
    symbol,
    price: existingSnapshot ? Number(existingSnapshot.price) : basePrice,
    previousPrice: existingSnapshot ? Number(existingSnapshot.price) : basePrice,
    high24h: existingSnapshot ? Number(existingSnapshot.high24h) : basePrice * 1.02,
    low24h: existingSnapshot ? Number(existingSnapshot.low24h) : basePrice * 0.98,
    volume24h: existingSnapshot ? Number(existingSnapshot.volume24h) : Math.random() * 1000,
    change24h: existingSnapshot ? Number(existingSnapshot.change24h) : 0,
    changePct24h: existingSnapshot ? Number(existingSnapshot.changePct24h) : 0,
    volatility: config?.volatility || 0.02,
    trend: config?.trend || 'neutral',
    tickIntervalMs: config?.tickIntervalMs || 1000,
    volumeMultiplier: config?.volumeMultiplier || 1.0,
    spreadBps: config?.spreadBps || 5,
    lastTick: Date.now(),
  };

  simulatorStates.set(symbol, state);
}

export function startMarketSimulator(): void {
  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'ADA/USDT'];

  pairs.forEach(pair => {
    initializeSimulator(pair).catch(error => {
      console.error(`Failed to initialize simulator for ${pair}:`, error);
    });
  });

  setTimeout(() => {
    setInterval(() => {
      simulatorStates.forEach(async (state, symbol) => {
        try {
          await tick(state);
        } catch (error) {
          console.error(`Simulator tick error for ${symbol}:`, error);
        }
      });
    }, config.marketTickIntervalMs);
  }, 1000);

  console.log('📈 Market simulator started for pairs:', pairs.join(', '));
}

export function getSimulatorState(symbol: string): SimulatorState | undefined {
  return simulatorStates.get(symbol);
}

export function getAllSimulatorStates(): SimulatorState[] {
  return Array.from(simulatorStates.values());
}
