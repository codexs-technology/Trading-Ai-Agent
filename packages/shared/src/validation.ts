import { z } from 'zod';

export const symbolSchema = z.string().regex(/^[A-Z0-9]+\/[A-Z0-9]+$/);

export const priceSchema = z.number().positive().finite();

export const quantitySchema = z.number().positive().finite();

export const orderSideSchema = z.enum(['BUY', 'SELL']);

export const orderTypeSchema = z.enum(['MARKET', 'LIMIT']);

export function validateSymbol(symbol: string): boolean {
  return symbolSchema.safeParse(symbol).success;
}

export function validatePrice(price: number): boolean {
  return priceSchema.safeParse(price).success;
}

export function validateQuantity(quantity: number): boolean {
  return quantitySchema.safeParse(quantity).success;
}

export function validateOrderParams(params: {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  price?: number;
  quantity: number;
}): { success: boolean; error?: string } {
  if (!validateSymbol(params.symbol)) {
    return { success: false, error: 'Invalid symbol format' };
  }

  if (!orderSideSchema.safeParse(params.side).success) {
    return { success: false, error: 'Invalid order side' };
  }

  if (!orderTypeSchema.safeParse(params.type).success) {
    return { success: false, error: 'Invalid order type' };
  }

  if (params.type === 'LIMIT') {
    if (params.price === undefined || !validatePrice(params.price)) {
      return { success: false, error: 'Limit orders require a valid price' };
    }
  }

  if (!validateQuantity(params.quantity)) {
    return { success: false, error: 'Invalid quantity' };
  }

  return { success: true };
}