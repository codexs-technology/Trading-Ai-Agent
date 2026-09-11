import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { prisma } from '@codex-trading/database';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { setupWebSocket } from './websocket';
import { startMarketSimulator } from './engines/marketSimulator';
import { registerRoutes } from './routes';

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(morgan(config.logFormat === 'json' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

registerRoutes(app);

app.use(errorHandler);

httpServer.listen(config.port, () => {
  console.log(`🚀 API server running on port ${config.port}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Demo Mode: ${config.demoMode ? 'ENABLED' : 'DISABLED'}`);
});

setupWebSocket(httpServer);

if (config.demoMode) {
  startMarketSimulator();
  console.log('📈 Market simulator started');
}

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export { app, httpServer };
