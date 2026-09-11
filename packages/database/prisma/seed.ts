import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  if (process.env.DEMO_MODE === 'true') {
    console.log('🧹 Cleaning existing demo data...');
    await prisma.aIMessage.deleteMany();
    await prisma.aIConversation.deleteMany();
    await prisma.adminAction.deleteMany();
    await prisma.priceAlert.deleteMany();
    await prisma.watchlist.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.walletTransaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.portfolioSnapshot.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.order.deleteMany();
    await prisma.candle.deleteMany();
    await prisma.marketSnapshot.deleteMany();
    await prisma.simulatorConfig.deleteMany();
    await prisma.tradingPair.deleteMany();
    await prisma.securitySetting.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.systemSetting.deleteMany();
    await prisma.user.deleteMany();
  }

  const passwordHash = await bcrypt.hash('DemoPass123!', 12);
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 12);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@codextrading.local',
      passwordHash,
      role: 'USER',
      isActive: true,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Zuhaib',
          lastName: 'Malik',
          timezone: 'UTC',
          locale: 'en',
        },
      },
      securitySettings: {
        create: {
          twoFactorEnabled: false,
          loginAlerts: true,
          apiKeysEnabled: true,
        },
      },
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@codextrading.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          timezone: 'UTC',
          locale: 'en',
        },
      },
      securitySettings: {
        create: {
          twoFactorEnabled: false,
          loginAlerts: true,
          apiKeysEnabled: true,
        },
      },
    },
  });

  console.log('✅ Created demo users');

  const pairs = [
    { symbol: 'BTC/USDT', baseAsset: 'BTC', quoteAsset: 'USDT', basePrecision: 8, quotePrecision: 2, minOrderSize: 0.00001, maxOrderSize: 100, tickSize: 0.01 },
    { symbol: 'ETH/USDT', baseAsset: 'ETH', quoteAsset: 'USDT', basePrecision: 8, quotePrecision: 2, minOrderSize: 0.0001, maxOrderSize: 10000, tickSize: 0.01 },
    { symbol: 'SOL/USDT', baseAsset: 'SOL', quoteAsset: 'USDT', basePrecision: 8, quotePrecision: 4, minOrderSize: 0.01, maxOrderSize: 100000, tickSize: 0.0001 },
    { symbol: 'BNB/USDT', baseAsset: 'BNB', quoteAsset: 'USDT', basePrecision: 8, quotePrecision: 2, minOrderSize: 0.001, maxOrderSize: 10000, tickSize: 0.01 },
    { symbol: 'XRP/USDT', baseAsset: 'XRP', quoteAsset: 'USDT', basePrecision: 8, quotePrecision: 4, minOrderSize: 1, maxOrderSize: 1000000, tickSize: 0.0001 },
    { symbol: 'DOGE/USDT', baseAsset: 'DOGE', quoteAsset: 'USDT', basePrecision: 8, quotePrecision: 5, minOrderSize: 1, maxOrderSize: 10000000, tickSize: 0.00001 },
    { symbol: 'ADA/USDT', baseAsset: 'ADA', quoteAsset: 'USDT', basePrecision: 8, quotePrecision: 4, minOrderSize: 1, maxOrderSize: 1000000, tickSize: 0.0001 },
  ];

  for (const pair of pairs) {
    await prisma.tradingPair.create({
      data: {
        ...pair,
        isActive: true,
        isDemo: true,
        makerFeeBps: 10,
        takerFeeBps: 10,
      },
    });
  }

  console.log('✅ Created trading pairs');

  const wallets = [
    { asset: 'USDT', balance: 5240.82, locked: 0 },
    { asset: 'BTC', balance: 0.0241, locked: 0 },
    { asset: 'ETH', balance: 0.84, locked: 0 },
    { asset: 'SOL', balance: 12.42, locked: 0 },
    { asset: 'BNB', balance: 2.15, locked: 0 },
  ];

  for (const wallet of wallets) {
    const w = await prisma.wallet.create({
      data: {
        userId: demoUser.id,
        asset: wallet.asset,
        balance: wallet.balance,
        locked: wallet.locked,
      },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: w.id,
        type: 'DEPOSIT',
        amount: wallet.balance,
        balanceBefore: 0,
        balanceAfter: wallet.balance,
        description: 'Initial demo deposit',
      },
    });
  }

  console.log('✅ Created wallets with demo balances');

  const simulatorConfigs = [
    { symbol: 'BTC/USDT', volatility: 0.02, trend: 'bullish', tickIntervalMs: 1000, volumeMultiplier: 1.0, spreadBps: 5 },
    { symbol: 'ETH/USDT', volatility: 0.025, trend: 'bullish', tickIntervalMs: 1000, volumeMultiplier: 1.2, spreadBps: 5 },
    { symbol: 'SOL/USDT', volatility: 0.04, trend: 'neutral', tickIntervalMs: 1000, volumeMultiplier: 1.5, spreadBps: 8 },
    { symbol: 'BNB/USDT', volatility: 0.03, trend: 'neutral', tickIntervalMs: 1000, volumeMultiplier: 1.0, spreadBps: 6 },
    { symbol: 'XRP/USDT', volatility: 0.035, trend: 'bearish', tickIntervalMs: 1000, volumeMultiplier: 2.0, spreadBps: 10 },
    { symbol: 'DOGE/USDT', volatility: 0.05, trend: 'volatile', tickIntervalMs: 1000, volumeMultiplier: 3.0, spreadBps: 15 },
    { symbol: 'ADA/USDT', volatility: 0.03, trend: 'neutral', tickIntervalMs: 1000, volumeMultiplier: 1.2, spreadBps: 8 },
  ];

  for (const config of simulatorConfigs) {
    await prisma.simulatorConfig.create({
      data: config,
    });
  }

  console.log('✅ Created simulator configs');

  const intervals = ['1m', '5m', '15m', '1h', '4h', '1D'];
  const basePrices: Record<string, number> = {
    'BTC/USDT': 67482.21,
    'ETH/USDT': 3421.56,
    'SOL/USDT': 142.34,
    'BNB/USDT': 567.89,
    'XRP/USDT': 0.5234,
    'DOGE/USDT': 0.1234,
    'ADA/USDT': 0.4567,
  };

  const now = new Date();
  for (const pair of pairs) {
    const basePrice = basePrices[pair.symbol] || 100;
    let currentPrice = basePrice;

    for (const interval of intervals) {
      let intervalMs: number;
      switch (interval) {
        case '1m': intervalMs = 60 * 1000; break;
        case '5m': intervalMs = 5 * 60 * 1000; break;
        case '15m': intervalMs = 15 * 60 * 1000; break;
        case '1h': intervalMs = 60 * 60 * 1000; break;
        case '4h': intervalMs = 4 * 60 * 60 * 1000; break;
        case '1D': intervalMs = 24 * 60 * 60 * 1000; break;
        default: intervalMs = 60 * 1000;
      }

      const candleCount = interval === '1m' ? 500 : interval === '5m' ? 300 : interval === '15m' ? 200 : interval === '1h' ? 200 : interval === '4h' ? 100 : 60;

      for (let i = candleCount; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMs);
        const volatility = simulatorConfigs.find(c => c.symbol === pair.symbol)?.volatility || 0.02;
        const change = (Math.random() - 0.5) * 2 * volatility;
        currentPrice = currentPrice * (1 + change);
        currentPrice = Math.max(currentPrice, basePrice * 0.5);

        const open = currentPrice * (1 + (Math.random() - 0.5) * 0.002);
        const close = currentPrice * (1 + (Math.random() - 0.5) * 0.002);
        const high = Math.max(open, close) * (1 + Math.random() * 0.005);
        const low = Math.min(open, close) * (1 - Math.random() * 0.005);
        const volume = Math.random() * 100 * (simulatorConfigs.find(c => c.symbol === pair.symbol)?.volumeMultiplier || 1);

        await prisma.candle.create({
          data: {
            symbol: pair.symbol,
            interval,
            timestamp,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume,
          },
        });
      }
    }
  }

  console.log('✅ Generated historical candles');

  const tradeHistory = [
    { symbol: 'BTC/USDT', side: 'BUY', price: 65000, quantity: 0.01, fee: 6.5, feeAsset: 'USDT', isMaker: false, daysAgo: 5 },
    { symbol: 'BTC/USDT', side: 'SELL', price: 67000, quantity: 0.01, fee: 6.7, feeAsset: 'USDT', isMaker: true, daysAgo: 3 },
    { symbol: 'ETH/USDT', side: 'BUY', price: 3200, quantity: 0.5, fee: 1.6, feeAsset: 'USDT', isMaker: false, daysAgo: 7 },
    { symbol: 'ETH/USDT', side: 'SELL', price: 3400, quantity: 0.5, fee: 1.7, feeAsset: 'USDT', isMaker: true, daysAgo: 4 },
    { symbol: 'SOL/USDT', side: 'BUY', price: 130, quantity: 50, fee: 6.5, feeAsset: 'USDT', isMaker: false, daysAgo: 10 },
    { symbol: 'SOL/USDT', side: 'SELL', price: 145, quantity: 50, fee: 7.25, feeAsset: 'USDT', isMaker: true, daysAgo: 6 },
    { symbol: 'BNB/USDT', side: 'BUY', price: 540, quantity: 2, fee: 1.08, feeAsset: 'USDT', isMaker: false, daysAgo: 14 },
    { symbol: 'BNB/USDT', side: 'SELL', price: 570, quantity: 2, fee: 1.14, feeAsset: 'USDT', isMaker: true, daysAgo: 10 },
    { symbol: 'XRP/USDT', side: 'BUY', price: 0.55, quantity: 10000, fee: 5.5, feeAsset: 'USDT', isMaker: false, daysAgo: 20 },
    { symbol: 'XRP/USDT', side: 'SELL', price: 0.52, quantity: 10000, fee: 5.2, feeAsset: 'USDT', isMaker: true, daysAgo: 18 },
    { symbol: 'DOGE/USDT', side: 'BUY', price: 0.13, quantity: 50000, fee: 6.5, feeAsset: 'USDT', isMaker: false, daysAgo: 25 },
    { symbol: 'DOGE/USDT', side: 'SELL', price: 0.11, quantity: 50000, fee: 5.5, feeAsset: 'USDT', isMaker: true, daysAgo: 22 },
  ];

  for (const trade of tradeHistory) {
    const createdAt = new Date(now.getTime() - trade.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.trade.create({
      data: {
        userId: demoUser.id,
        symbol: trade.symbol,
        side: trade.side,
        price: trade.price,
        quantity: trade.quantity,
        fee: trade.fee,
        feeAsset: trade.feeAsset,
        isMaker: trade.isMaker,
        createdAt,
        orderId: `seed-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    });
  }

  console.log('✅ Generated historical trades');

  let portfolioValue = 5240.82;
  for (let i = 30; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dailyChange = (Math.random() - 0.48) * 50;
    portfolioValue = Math.max(portfolioValue + dailyChange, 4000);
    const totalPnl = portfolioValue - 5000;
    const dailyPnl = i < 30 ? dailyChange : 0;

    await prisma.portfolioSnapshot.create({
      data: {
        userId: demoUser.id,
        totalValue: portfolioValue,
        totalPnl: totalPnl,
        dailyPnl: dailyPnl,
        unrealizedPnl: totalPnl * 0.3,
        realizedPnl: totalPnl * 0.7,
        winRate: 68.4,
        totalTrades: 120 + Math.floor(Math.random() * 20),
        winningTrades: 82,
        losingTrades: 38,
        timestamp,
      },
    });
  }

  console.log('✅ Created portfolio snapshots');

  await prisma.watchlist.createMany({
    data: [
      { userId: demoUser.id, symbol: 'BTC/USDT' },
      { userId: demoUser.id, symbol: 'ETH/USDT' },
      { userId: demoUser.id, symbol: 'SOL/USDT' },
    ],
  });

  console.log('✅ Created watchlist');

  await prisma.priceAlert.createMany({
    data: [
      { userId: demoUser.id, symbol: 'BTC/USDT', condition: 'PRICE_ABOVE', targetValue: 70000, isActive: true },
      { userId: demoUser.id, symbol: 'ETH/USDT', condition: 'PRICE_BELOW', targetValue: 3000, isActive: true },
    ],
  });

  console.log('✅ Created price alerts');

  await prisma.notification.createMany({
    data: [
      { userId: demoUser.id, type: 'SYSTEM_ANNOUNCEMENT', title: 'Welcome to Codex Trading', message: 'Your demo account has been created with simulated funds. Start exploring the trading terminal!', isRead: false },
      { userId: demoUser.id, type: 'ORDER_FILLED', title: 'Order Filled', message: 'Your BTC/USDT buy order for 0.01 BTC at $65,000 has been filled.', isRead: true, readAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { userId: demoUser.id, type: 'PRICE_ALERT', title: 'Price Alert: BTC/USDT', message: 'BTC/USDT has crossed above $70,000', isRead: false },
    ],
  });

  console.log('✅ Created notifications');

  await prisma.systemSetting.createMany({
    data: [
      { key: 'maker_fee_bps', value: '10', category: 'trading', isPublic: true },
      { key: 'taker_fee_bps', value: '10', category: 'trading', isPublic: true },
      { key: 'max_risk_per_trade_pct', value: '2', category: 'risk', isPublic: true },
      { key: 'max_portfolio_concentration_pct', value: '20', category: 'risk', isPublic: true },
      { key: 'demo_mode', value: 'true', category: 'general', isPublic: true },
      { key: 'maintenance_mode', value: 'false', category: 'general', isPublic: false },
    ],
  });

  console.log('✅ Created system settings');

  await prisma.adminAction.create({
    data: {
      adminId: adminUser.id,
      action: 'SEED_DEMO_DATA',
      targetType: 'system',
      description: 'Initial demo data seeded for investor demonstration',
    },
  });

  console.log('✅ Created admin action log');
  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('Demo Credentials:');
  console.log('  Email: demo@codextrading.local');
  console.log('  Password: DemoPass123!');
  console.log('');
  console.log('Admin Credentials:');
  console.log('  Email: admin@codextrading.local');
  console.log('  Password: AdminPass123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });