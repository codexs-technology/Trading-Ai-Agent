import { Decimal } from 'decimal.js';

export function formatCurrency(value: number | string | Decimal, currency = 'USDT', decimals = 2): string {
  const num = typeof value === 'string' ? new Decimal(value) : value instanceof Decimal ? value : new Decimal(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num.toNumber());
}

export function formatNumber(value: number | string | Decimal, decimals = 2): string {
  const num = typeof value === 'string' ? new Decimal(value) : value instanceof Decimal ? value : new Decimal(value);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num.toNumber());
}

export function formatPercentage(value: number | string | Decimal, decimals = 2): string {
  const num = typeof value === 'string' ? new Decimal(value) : value instanceof Decimal ? value : new Decimal(value);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: 'exceptZero',
  }).format(num.toNumber());
  return `${formatted}%`;
}

export function formatCompactNumber(value: number | string | Decimal): string {
  const num = typeof value === 'string' ? new Decimal(value) : value instanceof Decimal ? value : new Decimal(value);
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num.toNumber());
}