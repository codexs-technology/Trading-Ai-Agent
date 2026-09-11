import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@codex-trading/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const askAISchema = z.object({
  message: z.string(),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    symbol: z.string().optional(),
    includePortfolio: z.boolean().optional(),
    includeMarketData: z.boolean().optional(),
  }).optional(),
});

export function registerAIRoutes() {
  const router = Router();

  router.get('/conversations', async (req: AuthRequest, res, next) => {
    try {
      const conversations = await prisma.aIConversation.findMany({
        where: { userId: req.user!.id },
        orderBy: { updatedAt: 'desc' },
      });

      res.json(conversations);
    } catch (error) {
      next(error);
    }
  });

  router.get('/conversations/:id/messages', async (req: AuthRequest, res, next) => {
    try {
      const messages = await prisma.aIMessage.findMany({
        where: { conversationId: req.params.id, conversation: { userId: req.user!.id } },
        orderBy: { createdAt: 'asc' },
      });

      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  router.post('/ask', async (req: AuthRequest, res, next) => {
    try {
      const data = askAISchema.parse(req.body);

      let conversationId = data.conversationId;

      if (!conversationId) {
        const conversation = await prisma.aIConversation.create({
          data: {
            userId: req.user!.id,
            title: data.message.slice(0, 50) + (data.message.length > 50 ? '...' : ''),
          },
        });
        conversationId = conversation.id;
      }

      await prisma.aIMessage.create({
        data: {
          conversationId,
          role: 'USER',
          content: data.message,
        },
      });

      const context = data.context || {};
      let contextData: Record<string, unknown> = {};

      if (context.includeMarketData && context.symbol) {
        const snapshot = await prisma.marketSnapshot.findFirst({
          where: { symbol: context.symbol },
          orderBy: { timestamp: 'desc' },
        });
        contextData.market = snapshot;
      }

      if (context.includePortfolio) {
        const wallets = await prisma.wallet.findMany({
          where: { userId: req.user!.id },
        });
        contextData.portfolio = wallets;
      }

      // AI analysis (mock for demo)
      let aiResponse = '';

      if (context.symbol) {
        const symbol = context.symbol;
        const snapshot = await prisma.marketSnapshot.findFirst({
          where: { symbol },
          orderBy: { timestamp: 'desc' },
        });

        if (snapshot) {
          const changePct = Number(snapshot.changePct24h);
          const bias = changePct > 2 ? 'BULLISH' : changePct < -2 ? 'BEARISH' : 'NEUTRAL';
          const confidence = Math.abs(changePct) > 5 ? 78 : 62;

          aiResponse = `Market Analysis for ${symbol}:\n\nMarket Bias: ${bias}\nConfidence: ${confidence}%\nRisk: MODERATE\nCurrent Price: $${Number(snapshot.price).toLocaleString()}\n24h Change: ${changePct.toFixed(2)}%\n\nThis is simulated demo data for investor demonstration. AI trading features are planned for future phases.`;
        } else {
          aiResponse = `I don't have data for ${symbol}. This is a simulated demo environment.`;
        }
      } else {
        aiResponse = `Hello! I'm Codex AI, your trading intelligence assistant. I can help you analyze markets, explain trading concepts, and provide portfolio insights.\n\nNote: This is a simulated demo environment. Real AI-powered trading features are planned for future phases.`;
      }

      const assistantMessage = await prisma.aIMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: aiResponse,
        },
      });

      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      res.json({
        conversationId,
        message: assistantMessage,
        context: contextData,
        demo: true,
      });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/conversations/:id', async (req: AuthRequest, res, next) => {
    try {
      await prisma.aIMessage.deleteMany({
        where: { conversationId: req.params.id, conversation: { userId: req.user!.id } },
      });

      await prisma.aIConversation.delete({
        where: { id: req.params.id, userId: req.user!.id },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.get('/analysis/:symbol', async (req: AuthRequest, res, next) => {
    try {
      const symbol = req.params.symbol;
      const snapshot = await prisma.marketSnapshot.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
      });

      if (!snapshot) {
        throw new AppError(404, 'Market data not found', 'MARKET_DATA_NOT_FOUND');
      }

      const candles = await prisma.candle.findMany({
        where: { symbol, interval: '1h' },
        orderBy: { timestamp: 'desc' },
        take: 24,
      });

      const changePct = Number(snapshot.changePct24h);
      const bias = changePct > 2 ? 'BULLISH' : changePct < -2 ? 'BEARISH' : 'NEUTRAL';
      const risk = Math.abs(changePct) > 5 ? 'HIGH' : Math.abs(changePct) > 2 ? 'MODERATE' : 'LOW';

      res.json({
        symbol,
        marketBias: bias,
        confidence: Math.abs(changePct) > 5 ? 78 : 62,
        risk,
        support: Number(snapshot.price) * 0.98,
        resistance: Number(snapshot.price) * 1.02,
        analysis: `Market is currently showing ${bias.toLowerCase()} momentum with ${risk.toLowerCase()} risk. This is simulated demo data for investor demonstration.`,
        indicators: {
          rsi: 50 + changePct,
          macd: changePct > 0 ? 'bullish' : 'bearish',
          volume: 'normal',
        },
        timestamp: new Date(),
        demo: true,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
