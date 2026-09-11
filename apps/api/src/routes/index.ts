import { Application } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { registerAuthRoutes } from './auth';
import { registerMarketRoutes } from './markets';
import { registerOrderRoutes } from './orders';
import { registerTradeRoutes } from './trades';
import { registerWalletRoutes } from './wallet';
import { registerPortfolioRoutes } from './portfolio';
import { registerNotificationRoutes } from './notifications';
import { registerWatchlistRoutes } from './watchlist';
import { registerAlertRoutes } from './alerts';
import { registerUserRoutes } from './users';
import { registerAdminRoutes } from './admin';
import { registerAIRoutes } from './ai';

export function registerRoutes(app: Application): void {
  app.use('/api/auth', registerAuthRoutes());
  app.use('/api/markets', registerMarketRoutes());
  app.use('/api/orders', authMiddleware, registerOrderRoutes());
  app.use('/api/trades', authMiddleware, registerTradeRoutes());
  app.use('/api/wallet', authMiddleware, registerWalletRoutes());
  app.use('/api/portfolio', authMiddleware, registerPortfolioRoutes());
  app.use('/api/notifications', authMiddleware, registerNotificationRoutes());
  app.use('/api/watchlist', authMiddleware, registerWatchlistRoutes());
  app.use('/api/alerts', authMiddleware, registerAlertRoutes());
  app.use('/api/users', authMiddleware, registerUserRoutes());
  app.use('/api/admin', authMiddleware, registerAdminRoutes());
  app.use('/api/ai', authMiddleware, registerAIRoutes());
}
