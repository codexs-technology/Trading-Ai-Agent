import OpenAI from 'openai';
import { prisma } from '@codex-trading/database';
import { config } from '../config/index';

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: unknown) => Promise<unknown>;
}

export class AIService {
  private client: OpenAI | null = null;

  constructor() {
    if (config.openaiApiKey) {
      this.client = new OpenAI({ apiKey: config.openaiApiKey });
    }
  }

  async ask(
    userId: string,
    message: string,
    conversationId?: string,
    context?: { symbol?: string; includePortfolio?: boolean; includeMarketData?: boolean }
  ): Promise<{
    conversationId: string;
    response: string;
    context: Record<string, unknown>;
    toolsUsed: string[];
  }> {
    const systemPrompt = `You are Codex AI, an intelligent trading assistant for Codex Trading platform.
You provide market analysis, trading insights, and educational information about crypto markets.
IMPORTANT: This is a SIMULATED/DEMO trading environment. You must:
1. Always mention that data is simulated/demo
2. Never provide financial advice
3. Always include risk disclaimers
4. Be helpful but clear about limitations
5. Never suggest real trading decisions

Current context: ${context?.symbol ? `Analyzing ${context.symbol}` : 'General trading questions'}
Demo mode: ${config.demoMode}`;

    const tools: AITool[] = [];

    if (context?.includeMarketData && context?.symbol) {
      tools.push({
        name: 'getMarketData',
        description: 'Get current market data for a symbol',
        parameters: { type: 'object', properties: { symbol: { type: 'string' } } },
        execute: async (params) => {
          const symbol = (params as { symbol?: string }).symbol || context.symbol;
          const snapshot = await prisma.marketSnapshot.findFirst({
            where: { symbol },
            orderBy: { timestamp: 'desc' },
          });
          return snapshot || { error: 'Market data not found' };
        },
      });
    }

    if (context?.includePortfolio) {
      tools.push({
        name: 'getPortfolio',
        description: 'Get user portfolio summary',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          const wallets = await prisma.wallet.findMany({
            where: { userId },
          });
          return { wallets, total: wallets.reduce((sum, w) => sum + Number(w.balance), 0) };
        },
      });
    }

    const usedTools: string[] = [];
    let response = '';

    if (!this.client) {
      response = 'AI service is not configured. Please set OPENAI_API_KEY. This is a simulated demo environment.';
    } else {
      try {
        const completion = await this.client.chat.completions.create({
          model: config.openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          tools: tools.map(t => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          })),
        });

        const choice = completion.choices[0];
        if (choice.message.tool_calls) {
          for (const toolCall of choice.message.tool_calls) {
            const tool = tools.find(t => t.name === toolCall.function.name);
            if (tool) {
              usedTools.push(tool.name);
              const result = await tool.execute(JSON.parse(toolCall.function.arguments));
              // In production, you'd continue the conversation with the tool result
            }
          }
          response = choice.message.content || 'I processed your request.';
        } else {
          response = choice.message.content || 'I processed your request.';
        }
      } catch (error) {
        console.error('OpenAI error:', error);
        response = 'I encountered an error processing your request. This is a simulated demo environment.';
      }
    }

    return {
      conversationId: conversationId || 'new',
      response,
      context: {},
      toolsUsed: usedTools,
    };
  }
}

export const aiService = new AIService();
