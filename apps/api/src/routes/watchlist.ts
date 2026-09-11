import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const addWatchlistSchema = z.object({
  symbol: z.string(),
});

export function registerWatchlistRoutes() {
  const router = Router();

  router.get('/', async (req: AuthRequest, res, next) => {
    try {
      const watchlist = await prisma.watchlist.findMany({
        where: { userId: req.user!.id },
        include: {
          tradingPair: {
            include: { simulatorConfigs: true },
          },
        },
      });

      const enriched = await Promise.all(
        watchlist.map(async (item) => {
          const snapshot = await prisma.marketSnapshot.findFirst({
            where: { symbol: item.symbol },
            orderBy: { timestamp: 'desc' },
          });

          return {
            ...item,
            snapshot,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req: AuthRequest, res, next) => {
    try {
      const data = addWatchlistSchema.parse(req.body);

      const pair = await prisma.tradingPair.findUnique({
        where: { symbol: data.symbol },
      });

      if (!pair) {
        throw new AppError(404, 'Trading pair not found', 'PAIR_NOT_FOUND');
      }

      const item = await prisma.watchlist.upsert({
        where: { userId_symbol: { userId: req.user!.id, symbol: data.symbol } },
        create: { userId: req.user!.id, symbol: data.symbol },
        update: {},
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:symbol', async (req: AuthRequest, res, next) => {
    try {
      await prisma.watchlist.delete({
        where: { userId_symbol: { userId: req.user!.id, symbol: req.params.symbol } },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
