import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/auth';

export function registerAdminRoutes() {
  const router = Router();

  router.use(adminMiddleware);

  router.get('/dashboard', async (req: AuthRequest, res, next) => {
    try {
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({ where: { isActive: true } });
      const openOrders = await prisma.order.count({ where: { status: 'OPEN' } });
      const tradesToday = await prisma.trade.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
      const pairsCount = await prisma.tradingPair.count();

      const volume24h = await prisma.trade.aggregate({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        _sum: { price: true },
      });

      res.json({
        totalUsers,
        activeUsers,
        openOrders,
        tradesToday,
        volume24h: Number(volume24h._sum.price || 0),
        simulatedAssets: pairsCount,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/users', async (req: AuthRequest, res, next) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          profile: true,
        },
      });

      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders', async (req: AuthRequest, res, next) => {
    try {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { user: { select: { email: true } } },
      });

      res.json(orders);
    } catch (error) {
      next(error);
    }
  });

  router.get('/trades', async (req: AuthRequest, res, next) => {
    try {
      const trades = await prisma.trade.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { user: { select: { email: true } } },
      });

      res.json(trades);
    } catch (error) {
      next(error);
    }
  });

  router.get('/audit', async (req: AuthRequest, res, next) => {
    try {
      const actions = await prisma.adminAction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { admin: { select: { email: true } } },
      });

      res.json(actions);
    } catch (error) {
      next(error);
    }
  });

  router.get('/simulator', async (req: AuthRequest, res, next) => {
    try {
      const configs = await prisma.simulatorConfig.findMany({
        include: { tradingPair: true },
      });

      res.json(configs);
    } catch (error) {
      next(error);
    }
  });

  const simulatorUpdateSchema = z.object({
    symbol: z.string(),
    volatility: z.number().min(0).max(1).optional(),
    trend: z.enum(['bullish', 'bearish', 'neutral', 'volatile']).optional(),
    tickIntervalMs: z.number().int().positive().optional(),
    volumeMultiplier: z.number().positive().optional(),
    spreadBps: z.number().int().positive().optional(),
    isRunning: z.boolean().optional(),
  });

  router.patch('/simulator', async (req: AuthRequest, res, next) => {
    try {
      const data = simulatorUpdateSchema.parse(req.body);

      const config = await prisma.simulatorConfig.update({
        where: { symbol: data.symbol },
        data,
      });

      await prisma.adminAction.create({
        data: {
          adminId: req.user!.id,
          action: 'UPDATE_SIMULATOR_CONFIG',
          targetType: 'SimulatorConfig',
          targetId: data.symbol,
          description: `Updated simulator config for ${data.symbol}`,
          metadata: JSON.stringify({ changes: data }),
        },
      });

      res.json(config);
    } catch (error) {
      next(error);
    }
  });

  const demoActionSchema = z.object({
    action: z.enum([
      'RESET_DEMO_ACCOUNT',
      'GENERATE_TRADING_HISTORY',
      'GENERATE_WINNING_TRADES',
      'GENERATE_LOSING_TRADES',
      'SET_DEMO_BALANCE',
      'GENERATE_PORTFOLIO_HISTORY',
      'TRIGGER_MARKET_MOVEMENT',
    ]),
    payload: z.record(z.unknown()).optional(),
  });

  router.post('/demo', async (req: AuthRequest, res, next) => {
    try {
      const data = demoActionSchema.parse(req.body);

      await prisma.adminAction.create({
        data: {
          adminId: req.user!.id,
          action: data.action,
          description: `Demo control: ${data.action}`,
          metadata: JSON.stringify({ payload: data.payload }),
        },
      });

      res.json({ message: `Demo action ${data.action} executed` });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/users/:id', async (req: AuthRequest, res, next) => {
    try {
      const { isActive } = req.body;

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: Boolean(isActive) },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  router.get('/settings', async (req: AuthRequest, res, next) => {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { isPublic: true },
      });

      res.json(settings);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/settings/:key', async (req: AuthRequest, res, next) => {
    try {
      const { value } = req.body;

      const setting = await prisma.systemSetting.update({
        where: { key: req.params.key },
        data: { value },
      });

      res.json(setting);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
