import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { config } from '../config/index';

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

const updateSecuritySchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  loginAlerts: z.boolean().optional(),
  apiKeysEnabled: z.boolean().optional(),
});

export function registerUserRoutes() {
  const router = Router();

  router.get('/profile', async (req: AuthRequest, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          profile: true,
          securitySettings: {
            select: {
              twoFactorEnabled: true,
              loginAlerts: true,
              apiKeysEnabled: true,
            },
          },
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/profile', async (req: AuthRequest, res, next) => {
    try {
      const data = updateProfileSchema.parse(req.body);

      const profile = await prisma.profile.upsert({
        where: { userId: req.user!.id },
        create: { userId: req.user!.id, ...data },
        update: data,
      });

      res.json(profile);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/security', async (req: AuthRequest, res, next) => {
    try {
      const data = updateSecuritySchema.parse(req.body);

      const settings = await prisma.securitySetting.upsert({
        where: { userId: req.user!.id },
        create: { userId: req.user!.id, ...data },
        update: data,
      });

      res.json(settings);
    } catch (error) {
      next(error);
    }
  });

  router.get('/sessions', async (req: AuthRequest, res, next) => {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      res.json(sessions);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/sessions/:id', async (req: AuthRequest, res, next) => {
    try {
      await prisma.session.delete({
        where: { id: req.params.id, userId: req.user!.id },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/api-keys', async (req: AuthRequest, res, next) => {
    try {
      // Demo API key generation
      const apiKey = `CODEX_DEMO_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 16)}`.toUpperCase();
      const apiSecret = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 32)}`;

      // In a real app, you'd hash the secret and store it
      res.json({
        apiKey,
        apiSecret,
        name: `Demo Key ${new Date().toLocaleDateString()}`,
        permissions: ['read', 'trade'],
        warning: 'Demo API key - not for real trading',
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/preferences', async (req: AuthRequest, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { profile: true, securitySettings: true },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
