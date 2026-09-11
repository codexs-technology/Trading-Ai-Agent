import { Decimal } from 'decimal.js';

export function roundToPrecision(value: number | string | Decimal, precision: number): Decimal {
  const dec = typeof value === 'string' ? new Decimal(value) : value instanceof Decimal ? value : new Decimal(value);
  return dec.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP);
}

export function floorToPrecision(value: number | string | Decimal, precision: number): Decimal {
  const dec = typeof value === 'string' ? new Decimal(value) : value instanceof Decimal ? value : new Decimal(value);
  return dec.toDecimalPlaces(precision, Decimal.ROUND_FLOOR);
}

export function ceilToPrecision(value: number | string | Decimal, precision: number): Decimal {
  const dec = typeof value === 'string' ? new Decimal(value) : value instanceof Decimal ? value : new Decimal(value);
  return dec.toDecimalPlaces(precision, Decimal.ROUND_CEIL);
}

export function toFixedString(value: number | string | Decimal, precision: number): string {
  return roundToPrecision(value, precision).toFixed(precision);
}