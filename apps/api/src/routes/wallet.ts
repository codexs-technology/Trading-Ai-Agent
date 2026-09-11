import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';


const depositSchema = z.object({
  asset: z.string(),
  amount: z.number().positive(),
});

const withdrawalSchema = z.object({
  asset: z.string(),
  amount: z.number().positive(),
  address: z.string().optional(),
});

export function registerWalletRoutes() {
  const router = Router();

  router.get('/balances', async (req: AuthRequest, res, next) => {
    try {
      const wallets = await prisma.wallet.findMany({
        where: { userId: req.user!.id },
        orderBy: { asset: 'asc' },
      });

      const balancesWithValue = await Promise.all(
        wallets.map(async (wallet) => {
          let usdValue = 0;
          if (wallet.asset === 'USDT') {
            usdValue = Number(wallet.balance);
          } else {
            const snapshot = await prisma.marketSnapshot.findFirst({
              where: { symbol: `${wallet.asset}/USDT` },
              orderBy: { timestamp: 'desc' },
            });
            if (snapshot) {
              usdValue = Number(wallet.balance) * Number(snapshot.price);
            }
          }

          return {
            asset: wallet.asset,
            free: Number(wallet.balance) - Number(wallet.locked),
            locked: Number(wallet.locked),
            total: Number(wallet.balance),
            usdValue,
          };
        })
      );

      const totalValue = balancesWithValue.reduce((sum, b) => sum + b.usdValue, 0);

      res.json({ balances: balancesWithValue, totalValue });
    } catch (error) {
      next(error);
    }
  });

  router.get('/transactions', async (req: AuthRequest, res, next) => {
    try {
      const { asset, type, limit = '50', offset = '0' } = req.query;

      const where: any = {
        wallet: { userId: req.user!.id },
      };
      if (asset) where.wallet.asset = asset;
      if (type) where.type = type;

      const transactions = await prisma.walletTransaction.findMany({
        where,
        include: { wallet: { select: { asset: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit as string), 200),
        skip: parseInt(offset as string),
      });

      const total = await prisma.walletTransaction.count({ where });

      res.json({ transactions, total });
    } catch (error) {
      next(error);
    }
  });

  router.post('/deposit', async (req: AuthRequest, res, next) => {
    try {
      const data = depositSchema.parse(req.body);

      const wallet = await prisma.wallet.findUnique({
        where: { userId_asset: { userId: req.user!.id, asset: data.asset } },
      });

      if (!wallet) {
        throw new AppError(404, `Wallet for ${data.asset} not found`, 'WALLET_NOT_FOUND');
      }

      const newBalance = Number(wallet.balance) + data.amount;

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'DEPOSIT',
            amount: data.amount,
            balanceBefore: wallet.balance,
            balanceAfter: newBalance,
            description: 'Simulated deposit - no real blockchain transaction',
          },
        });
      });

      await updatePortfolioSnapshot(req.user!.id);

      res.json({ message: 'Deposit successful (simulated)', asset: data.asset, amount: data.amount });
    } catch (error) {
      next(error);
    }
  });

  router.post('/withdraw', async (req: AuthRequest, res, next) => {
    try {
      const data = withdrawalSchema.parse(req.body);

      const wallet = await prisma.wallet.findUnique({
        where: { userId_asset: { userId: req.user!.id, asset: data.asset } },
      });

      if (!wallet) {
        throw new AppError(404, `Wallet for ${data.asset} not found`, 'WALLET_NOT_FOUND');
      }

      const available = Number(wallet.balance) - wallet.locked;
      if (available < data.amount) {
        throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
      }

      const newBalance = Number(wallet.balance) - data.amount;

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'WITHDRAWAL',
            amount: Number(data.amount) * -1,
            balanceBefore: wallet.balance,
            balanceAfter: newBalance,
            description: 'Simulated withdrawal - no real blockchain transaction',
          },
        });
      });

      await updatePortfolioSnapshot(req.user!.id);

      res.json({ message: 'Withdrawal successful (simulated)', asset: data.asset, amount: data.amount });
    } catch (error) {
      next(error);
    }
  });

  router.get('/allocation', async (req: AuthRequest, res, next) => {
    try {
      const wallets = await prisma.wallet.findMany({
        where: { userId: req.user!.id },
      });

      const allocations = await Promise.all(
        wallets.map(async (wallet) => {
          let price = 0;
          let value = 0;

          if (wallet.asset === 'USDT') {
            price = 1;
            value = Number(wallet.balance);
          } else {
            const snapshot = await prisma.marketSnapshot.findFirst({
              where: { symbol: `${wallet.asset}/USDT` },
              orderBy: { timestamp: 'desc' },
            });
            if (snapshot) {
              price = Number(snapshot.price);
              value = Number(wallet.balance) * price;
            }
          }

          return {
            asset: wallet.asset,
            quantity: Number(wallet.balance),
            price,
            value,
            percentage: 0, // Will be calculated after
          };
        })
      );

      const totalValue = allocations.reduce((sum, a) => sum + a.value, 0);
      const allocationWithPercentage = allocations.map(a => ({
        ...a,
        percentage: totalValue > 0 ? (a.value / totalValue) * 100 : 0,
      }));

      res.json({ allocation: allocationWithPercentage, totalValue });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

async function updatePortfolioSnapshot(userId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
  });

  let totalValue = 0;
  for (const wallet of wallets) {
    if (wallet.asset === 'USDT') {
      totalValue += Number(wallet.balance);
    } else {
      const snapshot = await prisma.marketSnapshot.findFirst({
        where: { symbol: `${wallet.asset}/USDT` },
        orderBy: { timestamp: 'desc' },
      });
      if (snapshot) {
        totalValue += Number(wallet.balance) * Number(snapshot.price);
      }
    }
  }

  const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
    where: { userId },
    orderBy: { timestamp: 'desc' },
  });

  const previousValue = latestSnapshot ? Number(latestSnapshot.totalValue) : totalValue;
  const dailyPnl = totalValue - previousValue;
  const totalPnl = totalValue - 5000;

  await prisma.portfolioSnapshot.create({
    data: {
      userId,
      totalValue,
      totalPnl,
      dailyPnl,
      unrealizedPnl: 0,
      realizedPnl: totalPnl,
      timestamp: new Date(),
    },
  });
}
