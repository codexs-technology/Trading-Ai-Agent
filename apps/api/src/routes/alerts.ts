import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const createAlertSchema = z.object({
  symbol: z.string(),
  condition: z.enum(['PRICE_ABOVE', 'PRICE_BELOW', 'PRICE_CHANGE_PCT_ABOVE', 'PRICE_CHANGE_PCT_BELOW', 'VOLUME_ABOVE']),
  targetValue: z.number(),
});

export function registerAlertRoutes() {
  const router = Router();

  router.get('/', async (req: AuthRequest, res, next) => {
    try {
      const alerts = await prisma.priceAlert.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req: AuthRequest, res, next) => {
    try {
      const data = createAlertSchema.parse(req.body);

      const pair = await prisma.tradingPair.findUnique({
        where: { symbol: data.symbol },
      });

      if (!pair) {
        throw new AppError(404, 'Trading pair not found', 'PAIR_NOT_FOUND');
      }

      const alert = await prisma.priceAlert.create({
        data: {
          userId: req.user!.id,
          symbol: data.symbol,
          condition: data.condition,
          targetValue: data.targetValue,
        },
      });

      res.status(201).json(alert);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id', async (req: AuthRequest, res, next) => {
    try {
      const { isActive } = req.body;

      const alert = await prisma.priceAlert.update({
        where: { id: req.params.id, userId: req.user!.id },
        data: { isActive: Boolean(isActive) },
      });

      res.json(alert);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req: AuthRequest, res, next) => {
    try {
      await prisma.priceAlert.delete({
        where: { id: req.params.id, userId: req.user!.id },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
