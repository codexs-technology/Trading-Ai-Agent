import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.DEMO_MODE !== 'true') {
    console.error('❌ DEMO_MODE must be set to "true" to run demo reset');
    console.error('This is a safety measure to prevent accidental data loss.');
    process.exit(1);
  }

  console.log('🔄 Resetting demo environment...');

  // Delete all demo data except admin user
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

  // Keep trading pairs and system settings, but reset simulator configs
  await prisma.simulatorConfig.deleteMany();

  // Reset demo user data but keep the user
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@codextrading.local' },
  });

  if (demoUser) {
    await prisma.profile.deleteMany({ where: { userId: demoUser.id } });
    await prisma.securitySetting.deleteMany({ where: { userId: demoUser.id } });
    await prisma.session.deleteMany({ where: { userId: demoUser.id } });
  }

  console.log('🧹 Cleared demo data');

  // Re-seed by running the seed script logic
  const passwordHash = await bcrypt.hash('DemoPass123!', 12);

  if (demoUser) {
    await prisma.profile.create({
      data: {
        userId: demoUser.id,
        firstName: 'Zuhaib',
        lastName: 'Malik',
        timezone: 'UTC',
        locale: 'en',
      },
    });

    await prisma.securitySetting.create({
      data: {
        userId: demoUser.id,
        twoFactorEnabled: false,
        loginAlerts: true,
        apiKeysEnabled: true,
      },
    });
  }

  // Recreate simulator configs
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
    await prisma.simulatorConfig.create({ data: config });
  }

  // Recreate wallets
  if (demoUser) {
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
          description: 'Demo reset - initial deposit',
        },
      });
    }
  }

  console.log('✅ Demo environment reset complete');
  console.log('');
  console.log('Demo Credentials:');
  console.log('  Email: demo@codextrading.local');
  console.log('  Password: DemoPass123!');
}

main()
  .catch((e) => {
    console.error('❌ Demo reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });