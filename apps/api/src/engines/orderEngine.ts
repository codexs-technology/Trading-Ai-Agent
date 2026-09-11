import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { Decimal } from 'decimal.js';

async function getMarketPrice(symbol: string): Promise<number> {
  const snapshot = await prisma.marketSnapshot.findFirst({
    where: { symbol },
    orderBy: { timestamp: 'desc' },
  });
  return snapshot ? Number(snapshot.price) : 0;
}

async function calculateFee(price: number, quantity: number, feeRateBps: number): Promise<number> {
  const amount = new Decimal(price).times(quantity);
  return amount.times(feeRateBps).div(10000).toNumber();
}

export async function createOrder(params: {
  userId: string;
  symbol: string;
  side: OrderSide;
  type: 'MARKET' | 'LIMIT';
  price?: number;
  quantity: number;
}): Promise<unknown> {
  const pair = await prisma.tradingPair.findUnique({
    where: { symbol: params.symbol },
  });

  if (!pair || !pair.isActive) {
    throw new AppError(404, 'Trading pair not found or inactive', 'PAIR_NOT_FOUND');
  }

  const marketPrice = await getMarketPrice(params.symbol);
  if (marketPrice === 0) {
    throw new AppError(400, 'Market price unavailable', 'PRICE_UNAVAILABLE');
  }

  const executePrice = params.type === 'MARKET' ? marketPrice : params.price!;
  const feeRateBps = params.type === 'MARKET' ? pair.takerFeeBps : pair.makerFeeBps;
  const feeAsset = params.side === 'BUY' ? pair.quoteAsset : pair.baseAsset;

  let requiredAsset: string;
  let requiredAmount: number;

  if (params.side === 'BUY') {
    requiredAsset = pair.quoteAsset;
    requiredAmount = executePrice * params.quantity * (1 + feeRateBps / 10000);
  } else {
    requiredAsset = pair.baseAsset;
    requiredAmount = params.quantity;
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId_asset: { userId: params.userId, asset: requiredAsset } },
  });

  if (!wallet) {
    throw new AppError(400, `Wallet for ${requiredAsset} not found`, 'WALLET_NOT_FOUND');
  }

  const available = Number(wallet.balance) - Number(wallet.locked);
  if (available < requiredAmount) {
    throw new AppError(400, `Insufficient ${requiredAsset} balance`, 'INSUFFICIENT_BALANCE');
  }

  const order = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId_asset: { userId: params.userId, asset: requiredAsset } },
      data: { locked: { increment: requiredAmount } },
    });

    return tx.order.create({
      data: {
        userId: params.userId,
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        status: OrderStatus.OPEN,
        price: params.price,
        quantity: params.quantity,
        remainingQty: params.quantity,
        feeAsset,
      },
    });
  });

  if (params.type === 'MARKET') {
    await executeMarketOrder(order.id);
  }

  return order;
}

export async function cancelOrder(orderId: string, userId: string): Promise<void> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
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
    ? (order.price || 0) * Number(order.remainingQty)
    : Number(order.remainingQty);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        remainingQty: 0,
      },
    });

    const wallet = await tx.wallet.findUnique({
      where: { userId_asset: { userId, asset: lockedAsset } },
    });

    if (wallet && lockedAmount > 0) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { locked: { decrement: lockedAmount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'TRADE',
          amount: lockedAmount,
          balanceBefore: Number(wallet.balance),
          balanceAfter: Number(wallet.balance),
          referenceType: 'ORDER_CANCEL',
          description: 'Unlocked from cancelled order',
        },
      });
    }
  });
}

async function executeMarketOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.type !== 'MARKET' || order.status !== OrderStatus.OPEN) return;

  const pair = await prisma.tradingPair.findUnique({
    where: { symbol: order.symbol },
  });

  if (!pair) return;

  const marketPrice = await getMarketPrice(order.symbol);
  if (marketPrice === 0) return;

  const feeRateBps = order.side === 'BUY' ? pair.takerFeeBps : pair.makerFeeBps;
  const fee = await calculateFee(marketPrice, Number(order.quantity), feeRateBps);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FILLED,
        filledQty: order.quantity,
        remainingQty: 0,
        avgFillPrice: marketPrice,
        fee,
        feeAsset: order.feeAsset,
        filledAt: new Date(),
      },
    });

    await tx.trade.create({
      data: {
        orderId,
        userId: order.userId,
        symbol: order.symbol,
        side: order.side,
        price: marketPrice,
        quantity: order.quantity,
        fee,
        feeAsset: order.feeAsset!,
        isMaker: false,
      },
    });

    if (order.side === OrderSide.BUY) {
      const baseWallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: order.userId, asset: pair.baseAsset } },
      });

      if (baseWallet) {
        await tx.wallet.update({
          where: { id: baseWallet.id },
          data: { balance: { increment: Number(order.quantity) } },
        });
      }

      const quoteWallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: order.userId, asset: pair.quoteAsset } },
      });

      const totalCost = marketPrice * Number(order.quantity) + fee;
      if (quoteWallet) {
        await tx.wallet.update({
          where: { id: quoteWallet.id },
          data: {
            locked: { decrement: totalCost },
            balance: { decrement: totalCost },
          },
        });
      }
    } else {
      const quoteWallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: order.userId, asset: pair.quoteAsset } },
      });

      const proceeds = marketPrice * Number(order.quantity) - fee;
      if (quoteWallet) {
        await tx.wallet.update({
          where: { id: quoteWallet.id },
          data: { balance: { increment: proceeds } },
        });
      }

      const baseWallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: order.userId, asset: pair.baseAsset } },
      });

      if (baseWallet) {
        await tx.wallet.update({
          where: { id: baseWallet.id },
          data: {
            locked: { decrement: Number(order.quantity) },
            balance: { decrement: Number(order.quantity) },
          },
        });
      }
    }
  });
}

export async function matchLimitOrders(): Promise<void> {
  const openOrders = await prisma.order.findMany({
    where: {
      type: 'LIMIT',
      status: OrderStatus.OPEN,
      price: { not: null },
    },
    include: { user: true },
  });

  for (const order of openOrders) {
    const marketPrice = await getMarketPrice(order.symbol);
    if (marketPrice === 0) continue;

    const shouldExecute = order.side === 'BUY' ? marketPrice <= Number(order.price) : marketPrice >= Number(order.price);

    if (shouldExecute) {
      await executeMarketOrder(order.id);
    }
  }
}
