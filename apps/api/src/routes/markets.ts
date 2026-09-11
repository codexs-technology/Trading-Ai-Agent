import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { tradingPairs, candleIntervals } from '@codex-trading/config';

export function registerMarketRoutes() {
  const router = Router();

  router.get('/pairs', async (req, res, next) => {
    try {
      const pairs = await prisma.tradingPair.findMany({
        where: { isActive: true },
        include: {
          simulatorConfigs: true,
        },
        orderBy: { symbol: 'asc' },
      });

      res.json(pairs);
    } catch (error) {
      next(error);
    }
  });

  router.get('/pairs/:symbol', async (req, res, next) => {
    try {
      const { symbol } = req.params;

      const pair = await prisma.tradingPair.findUnique({
        where: { symbol },
        include: { simulatorConfigs: true },
      });

      if (!pair) {
        throw new AppError(404, 'Trading pair not found', 'PAIR_NOT_FOUND');
      }

      const snapshot = await prisma.marketSnapshot.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
      });

      res.json({ ...pair, snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.get('/tickers', async (req, res, next) => {
    try {
      const snapshots = await prisma.marketSnapshot.findMany({
        distinct: ['symbol'],
        orderBy: { timestamp: 'desc' },
      });

      res.json(snapshots);
    } catch (error) {
      next(error);
    }
  });

  router.get('/tickers/:symbol', async (req, res, next) => {
    try {
      const { symbol } = req.params;

      const snapshot = await prisma.marketSnapshot.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
      });

      if (!snapshot) {
        throw new AppError(404, 'Market data not found', 'MARKET_DATA_NOT_FOUND');
      }

      res.json(snapshot);
    } catch (error) {
      next(error);
    }
  });

  router.get('/candles/:symbol', async (req, res, next) => {
    try {
      const { symbol } = req.params;
      const interval = req.query.interval as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 500, 1000);
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      if (!candleIntervals.includes(interval as any)) {
        throw new AppError(400, 'Invalid interval', 'INVALID_INTERVAL');
      }

      const where: any = { symbol, interval };
      if (from || to) {
        where.timestamp = {};
        if (from) where.timestamp.gte = from;
        if (to) where.timestamp.lte = to;
      }

      const candles = await prisma.candle.findMany({
        where,
        orderBy: { timestamp: 'asc' },
        take: limit,
      });

      res.json(candles);
    } catch (error) {
      next(error);
    }
  });

  router.get('/orderbook/:symbol', async (req, res, next) => {
    try {
      const { symbol } = req.params;
      const depth = Math.min(parseInt(req.query.depth as string) || 50, 200);

      const pair = await prisma.tradingPair.findUnique({
        where: { symbol },
        include: { simulatorConfigs: true },
      });

      if (!pair) {
        throw new AppError(404, 'Trading pair not found', 'PAIR_NOT_FOUND');
      }

      const snapshot = await prisma.marketSnapshot.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
      });

      if (!snapshot) {
        throw new AppError(404, 'Market data not found', 'MARKET_DATA_NOT_FOUND');
      }

      const spread = Number(snapshot.ask) - Number(snapshot.bid);
      const midPrice = (Number(snapshot.bid) + Number(snapshot.ask)) / 2;
      const spreadBps = pair.simulatorConfigs?.spreadBps || 5;

      const asks: Array<{ price: number; quantity: number; total: number }> = [];
      const bids: Array<{ price: number; quantity: number; total: number }> = [];

      let askTotal = 0;
      for (let i = 0; i < depth; i++) {
        const priceOffset = (spread / 2) + (i * midPrice * 0.0005);
        const price = midPrice + priceOffset;
        const quantity = Math.random() * 10 * (pair.simulatorConfigs?.volumeMultiplier || 1);
        askTotal += quantity;
        asks.push({ price: Number(price.toFixed(pair.quotePrecision)), quantity, total: askTotal });
      }

      let bidTotal = 0;
      for (let i = 0; i < depth; i++) {
        const priceOffset = (spread / 2) + (i * midPrice * 0.0005);
        const price = midPrice - priceOffset;
        const quantity = Math.random() * 10 * (pair.simulatorConfigs?.volumeMultiplier || 1);
        bidTotal += quantity;
        bids.push({ price: Number(price.toFixed(pair.quotePrecision)), quantity, total: bidTotal });
      }

      res.json({
        symbol,
        asks: asks.reverse(),
        bids,
        spread: Number(spread.toFixed(pair.quotePrecision)),
        timestamp: new Date(),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/trades/:symbol', async (req, res, next) => {
    try {
      const { symbol } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

      const trades = await prisma.trade.findMany({
        where: { symbol },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          price: true,
          quantity: true,
          side: true,
          createdAt: true,
        },
      });

      res.json(trades.reverse());
    } catch (error) {
      next(error);
    }
  });

  router.get('/stats', async (req, res, next) => {
    try {
      const pairs = await prisma.tradingPair.findMany({
        where: { isActive: true },
        select: { symbol: true },
      });

      const stats = await Promise.all(
        pairs.map(async (pair) => {
          const snapshot = await prisma.marketSnapshot.findFirst({
            where: { symbol: pair.symbol },
            orderBy: { timestamp: 'desc' },
          });

          const volume24h = await prisma.trade.aggregate({
            where: {
              symbol: pair.symbol,
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            _sum: { quantity: true },
          });

          return {
            symbol: pair.symbol,
            price: snapshot?.price || 0,
            change24h: snapshot?.change24h || 0,
            changePct24h: snapshot?.changePct24h || 0,
            volume24h: Number(volume24h._sum.quantity || 0),
            high24h: snapshot?.high24h || 0,
            low24h: snapshot?.low24h || 0,
          };
        })
      );

      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
