import { z } from 'zod';

export const WalletSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  asset: z.string(),
  balance: z.number(),
  locked: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Wallet = z.infer<typeof WalletSchema>;

export const WalletBalanceSchema = z.object({
  asset: z.string(),
  free: z.number(),
  locked: z.number(),
  total: z.number(),
  usdValue: z.number(),
});
export type WalletBalance = z.infer<typeof WalletBalanceSchema>;

export const WalletTransactionTypeSchema = z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRADE', 'FEE', 'TRANSFER']);
export type WalletTransactionType = z.infer<typeof WalletTransactionTypeSchema>;

export const WalletTransactionSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  type: WalletTransactionTypeSchema,
  amount: z.number(),
  balanceBefore: z.number(),
  balanceAfter: z.number(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.date(),
});
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;

export const DepositInputSchema = z.object({
  asset: z.string(),
  amount: z.number().positive(),
});
export type DepositInput = z.infer<typeof DepositInputSchema>;

export const WithdrawalInputSchema = z.object({
  asset: z.string(),
  amount: z.number().positive(),
  address: z.string().optional(),
});
export type WithdrawalInput = z.infer<typeof WithdrawalInputSchema>;

export const AssetAllocationSchema = z.object({
  asset: z.string(),
  quantity: z.number(),
  price: z.number(),
  value: z.number(),
  percentage: z.number(),
});
export type AssetAllocation = z.infer<typeof AssetAllocationSchema>;