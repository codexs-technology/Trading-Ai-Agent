import { Router } from 'express';
import { prisma } from '@codex-trading/database';
import { AuthRequest } from '../middleware/auth';

export function registerTradeRoutes() {
  const router = Router();

  router.get('/', async (req: AuthRequest, res, next) => {
    try {
      const { symbol, side, limit = '100', offset = '0', from, to } = req.query;

      const where: any = { userId: req.user!.id };
      if (symbol) where.symbol = symbol;
      if (side) where.side = side;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from as string);
        if (to) where.createdAt.lte = new Date(to as string);
      }

      const trades = await prisma.trade.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit as string), 500),
        skip: parseInt(offset as string),
      });

      const total = await prisma.trade.count({ where });

      res.json({ trades, total });
    } catch (error) {
      next(error);
    }
  });

  router.get('/stats', async (req: AuthRequest, res, next) => {
    try {
      const trades = await prisma.trade.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'asc' },
      });

      const totalTrades = trades.length;
      const buyTrades = trades.filter(t => t.side === 'BUY').length;
      const sellTrades = trades.filter(t => t.side === 'SELL').length;

      const totalFees = trades.reduce((sum, t) => sum + Number(t.fee), 0);
      const totalVolume = trades.reduce((sum, t) => sum + Number(t.price) * Number(t.quantity), 0);

      const winningTrades = trades.filter(t => {
        // Simplified win calculation
        return Math.random() > 0.3; // Placeholder
      }).length;

      res.json({
        totalTrades,
        buyTrades,
        sellTrades,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
        winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
        totalFees,
        totalVolume,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
