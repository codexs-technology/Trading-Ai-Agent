import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateClientOrderId } from '@codex-trading/shared';

const createOrderSchema = z.object({
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT']),
  price: z.number().positive().optional(),
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

const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
});

async function getMarketPrice(symbol: string): Promise<number> {
  const snapshot = await prisma.marketSnapshot.findFirst({
    where: { symbol },
    orderBy: { timestamp: 'desc' },
  });
  return snapshot ? Number(snapshot.price) : 0;
}

async function getWallet(userId: string, asset: string) {
  return prisma.wallet.findUnique({
    where: { userId_asset: { userId, asset } },
  });
}

async function lockBalance(userId: string, asset: string, amount: number) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId_asset: { userId, asset } },
    });

    if (!wallet) {
      throw new AppError(400, `Wallet for ${asset} not found`, 'WALLET_NOT_FOUND');
    }

    const available = Number(wallet.balance) - wallet.locked;
    if (available.lessThan(amount)) {
      throw new AppError(400, `Insufficient ${asset} balance`, 'INSUFFICIENT_BALANCE');
    }

    await tx.wallet.update({
      where: { userId_asset: { userId, asset } },
      data: { locked: { increment: Number(amount) } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'TRADE',
        amount: Number(amount * -1),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        referenceType: 'ORDER_LOCK',
        description: `Locked for order`,
      },
    });
  });
}

async function unlockBalance(userId: string, asset: string, amount: number) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId_asset: { userId, asset } },
    });

    if (!wallet) return;

    await tx.wallet.update({
      where: { userId_asset: { userId, asset } },
      data: { locked: { decrement: Number(amount) } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'TRADE',
        amount: amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        referenceType: 'ORDER_UNLOCK',
        description: `Unlocked from cancelled order`,
      },
    });
  });
}

export function registerOrderRoutes() {
  const router = Router();

  router.get('/', async (req: AuthRequest, res, next) => {
    try {
      const { status, symbol, limit = '50', offset = '0' } = req.query;

      const where: any = { userId: req.user!.id };
      if (status) where.status = status;
      if (symbol) where.symbol = symbol;

      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit as string), 100),
        skip: parseInt(offset as string),
      });

      const total = await prisma.order.count({ where });

      res.json({ orders, total });
    } catch (error) {
      next(error);
    }
  });

  router.get('/open', async (req: AuthRequest, res, next) => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          userId: req.user!.id,
          status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(orders);
    } catch (error) {
      next(error);
    }
  });

  router.get('/history', async (req: AuthRequest, res, next) => {
    try {
      const { symbol, limit = '100', offset = '0' } = req.query;

      const where: any = { userId: req.user!.id };
      if (symbol) where.symbol = symbol;

      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit as string), 500),
        skip: parseInt(offset as string),
      });

      const total = await prisma.order.count({ where });

      res.json({ orders, total });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req: AuthRequest, res, next) => {
    try {
      const order = await prisma.order.findFirst({
        where: { id: req.params.id, userId: req.user!.id },
        include: { trades: true },
      });

      if (!order) {
        throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
      }

      res.json(order);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req: AuthRequest, res, next) => {
    try {
      const data = createOrderSchema.parse(req.body);

      const pair = await prisma.tradingPair.findUnique({
        where: { symbol: data.symbol },
      });

      if (!pair || !pair.isActive) {
        throw new AppError(404, 'Trading pair not found or inactive', 'PAIR_NOT_FOUND');
      }

      const marketPrice = await getMarketPrice(data.symbol);
      if (marketPrice === 0) {
        throw new AppError(400, 'Market price unavailable', 'PRICE_UNAVAILABLE');
      }

      const executePrice = data.type === 'MARKET' ? marketPrice : data.price!;
      const feeRateBps = data.type === 'MARKET' ? pair.takerFeeBps : pair.makerFeeBps;
      const feeAsset = data.side === 'BUY' ? pair.quoteAsset : pair.baseAsset;

      let requiredAsset: string;
      let requiredamount: number;

      if (data.side === 'BUY') {
        requiredAsset = pair.quoteAsset;
        requiredAmount = Number(executePrice) * data.quantity;
        const fee = requiredAmount * feeRateBps / 10000;
        requiredAmount = requiredAmount + fee;
      } else {
        requiredAsset = pair.baseAsset;
        requiredAmount = Number(data.quantity);
      }

      const wallet = await getWallet(req.user!.id, requiredAsset);
      if (!wallet) {
        throw new AppError(400, `Wallet for ${requiredAsset} not found`, 'WALLET_NOT_FOUND');
      }

      const available = Number(wallet.balance) - wallet.locked;
      if (available.lessThan(requiredAmount)) {
        throw new AppError(400, `Insufficient ${requiredAsset} balance`, 'INSUFFICIENT_BALANCE');
      }

      const order = await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId_asset: { userId: req.user!.id, asset: requiredAsset } },
          data: { locked: { increment: requiredAmount } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'TRADE',
            amount: Number(requiredAmount * -1),
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance,
            referenceType: 'ORDER_CREATE',
            description: `Locked for ${data.type} ${data.side} order`,
          },
        });

        return tx.order.create({
          data: {
            userId: req.user!.id,
            symbol: data.symbol,
            side: data.side,
            type: data.type,
            status: OrderStatus.OPEN,
            price: data.price,
            quantity: data.quantity,
            remainingQty: data.quantity,
            feeAsset,
            clientOrderId: generateClientOrderId(),
          },
        });
      });

      if (data.type === 'MARKET') {
        await executeMarketOrder(order.id);
      }

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req: AuthRequest, res, next) => {
    try {
      const data = cancelOrderSchema.parse({ orderId: req.params.id });

      const order = await prisma.order.findFirst({
        where: { id: data.orderId, userId: req.user!.id },
      });

      if (!order) {
        throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
      }

      if (!['OPEN', 'PARTIALLY_FILLED'].includes(order.status)) {
        throw new AppError(400, 'Order cannot be cancelled', 'CANNOT_CANCEL');
      }

      const pair = await prisma.tradingPair.findUnique({
        where: { symbol: order.symbol },
      });

      if (!pair) {
        throw new AppError(404, 'Trading pair not found', 'PAIR_NOT_FOUND');
      }

      const lockedAsset = order.side === 'BUY' ? pair.quoteAsset : pair.baseAsset;
      const lockedAmount = order.side === 'BUY'
        ? Number(order.price || 0) * order.remainingQty
        : Number(order.remainingQty);

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            remainingQty: 0,
          },
        });

        await unlockBalance(req.user!.id, lockedAsset, lockedAmount);
      });

      res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

async function executeMarketOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order || order.type !== 'MARKET' || order.status !== 'OPEN') return;

  const pair = await prisma.tradingPair.findUnique({
    where: { symbol: order.symbol },
  });

  if (!pair) return;

  const marketPrice = await getMarketPrice(order.symbol);
  if (marketPrice === 0) return;

  const feeRateBps = order.side === 'BUY' ? pair.takerFeeBps : pair.makerFeeBps;
  const feeAsset = order.side === 'BUY' ? pair.quoteAsset : pair.baseAsset;

  await prisma.$transaction(async (tx) => {
    const filledQty = order.quantity;
    const executionPrice = marketPrice;
    const fee = Number(executionPrice) * filledQty * feeRateBps / 10000;

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FILLED,
        filledQty,
        remainingQty: 0,
        avgFillPrice: executionPrice,
        fee,
        feeAsset,
        filledAt: new Date(),
      },
    });

    await tx.trade.create({
      data: {
        orderId,
        userId: order.userId,
        symbol: order.symbol,
        side: order.side,
        price: executionPrice,
        quantity: filledQty,
        fee,
        feeAsset,
        isMaker: false,
      },
    });

    if (order.side === 'BUY') {
      const baseWallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: order.userId, asset: pair.baseAsset } },
      });

      if (baseWallet) {
        await tx.wallet.update({
          where: { id: baseWallet.id },
          data: { balance: { increment: Number(filledQty) } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: baseWallet.id,
            type: 'TRADE',
            amount: filledQty,
            balanceBefore: baseWallet.balance,
            balanceAfter: Number(baseWallet.balance) + filledQty,
            referenceId: orderId,
            referenceType: 'TRADE',
            description: `Bought ${filledQty} ${pair.baseAsset}`,
          },
        });
      }

      const quoteWallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: order.userId, asset: pair.quoteAsset } },
      });

      const totalCost = Number(executionPrice) * filledQty + fee;
      if (quoteWallet) {
        await tx.wallet.update({
          where: { id: quoteWallet.id },
          data: {
            locked: { decrement: Number(totalCost) },
            balance: { decrement: Number(totalCost) },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: quoteWallet.id,
            type: 'FEE',
            amount: Number(fee * -1),
            balanceBefore: quoteWallet.balance,
            balanceAfter: Number(quoteWallet.balance) - totalCost,
            referenceId: orderId,
            referenceType: 'TRADE_FEE',
            description: `Trading fee for ${order.side} order`,
          },
        });
      }
    } else {
      const quoteWallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: order.userId, asset: pair.quoteAsset } },
      });

      if (quoteWallet) {
        const proceeds = Number(executionPrice) * filledQty - fee;
        await tx.wallet.update({
          where: { id: quoteWallet.id },
          data: { balance: { increment: Number(proceeds) } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: quoteWallet.id,
            type: 'TRADE',
            amount: proceeds,
            balanceBefore: quoteWallet.balance,
            balanceAfter: Number(quoteWallet.balance) + proceeds,
            referenceId: orderId,
            referenceType: 'TRADE',
            description: `Sold ${filledQty} ${pair.baseAsset}`,
          },
        });
      }

      const baseWallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: order.userId, asset: pair.baseAsset } },
      });

      if (baseWallet) {
        await tx.wallet.update({
          where: { id: baseWallet.id },
          data: {
            locked: { decrement: Number(filledQty) },
            balance: { decrement: Number(filledQty) },
          },
        });
      }
    }

    await updatePortfolioSnapshot(order.userId);
  });
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
  const totalPnl = totalValue - 5000; // Assuming 5000 initial deposit

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
