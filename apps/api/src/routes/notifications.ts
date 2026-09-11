import { Router } from 'express';
import { prisma } from '@codex-trading/database';
import { AuthRequest } from '../middleware/auth';

export function registerNotificationRoutes() {
  const router = Router();

  router.get('/', async (req: AuthRequest, res, next) => {
    try {
      const { unreadOnly, limit = '50', offset = '0' } = req.query;

      const where: any = { userId: req.user!.id };
      if (unreadOnly === 'true') where.isRead = false;

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit as string), 200),
        skip: parseInt(offset as string),
      });

      const total = await prisma.notification.count({ where });
      const unreadCount = await prisma.notification.count({
        where: { userId: req.user!.id, isRead: false },
      });

      res.json({ notifications, total, unreadCount });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id/read', async (req: AuthRequest, res, next) => {
    try {
      await prisma.notification.update({
        where: { id: req.params.id, userId: req.user!.id },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/read-all', async (req: AuthRequest, res, next) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req: AuthRequest, res, next) => {
    try {
      await prisma.notification.delete({
        where: { id: req.params.id, userId: req.user!.id },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
