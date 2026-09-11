import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { config } from '../config/index';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

function generateTokens(userId: string, email: string, role: string) {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    config.jwtSecret,
    { algorithm: 'HS256' }
  );

  return { accessToken, refreshToken };
}

export function registerAuthRoutes() {
  const router = Router();

  router.post('/register', async (req, res, next) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
      }

      const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          profile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
            },
          },
          securitySettings: {
            create: {},
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      const tokens = generateTokens(user.id, user.email, user.role);

      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      res.status(201).json({
        user: { id: user.id, email: user.email, role: user.role },
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user || !user.isActive) {
        throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      }

      const validPassword = await bcrypt.compare(data.password, user.passwordHash);
      if (!validPassword) {
        throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      }

      const tokens = generateTokens(user.id, user.email, user.role);

      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        user: { id: user.id, email: user.email, role: user.role },
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await prisma.session.deleteMany({
          where: { token },
        });
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  });

  router.post('/refresh', async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError(400, 'Refresh token required', 'MISSING_REFRESH_TOKEN');
      }

      const session = await prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
      }

      const tokens = generateTokens(session.user.id, session.user.email, session.user.role);

      await prisma.session.update({
        where: { id: session.id },
        data: { token: tokens.refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });

      res.json(tokens);
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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

  router.post('/change-password', async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
      }

      const data = changePasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
      }

      const validPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!validPassword) {
        throw new AppError(401, 'Current password is incorrect', 'INVALID_PASSWORD');
      }

      const newPasswordHash = await bcrypt.hash(data.newPassword, config.bcryptRounds);

      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash: newPasswordHash },
      });

      await prisma.session.deleteMany({
        where: { userId: req.user.id },
      });

      res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
