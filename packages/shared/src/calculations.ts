import { Decimal } from 'decimal.js';

export function calculatePnl(
  entryPrice: number | string | Decimal,
  exitPrice: number | string | Decimal,
  quantity: number | string | Decimal,
  side: 'BUY' | 'SELL'
): Decimal {
  const entry = typeof entryPrice === 'string' ? new Decimal(entryPrice) : entryPrice instanceof Decimal ? entryPrice : new Decimal(entryPrice);
  const exit = typeof exitPrice === 'string' ? new Decimal(exitPrice) : exitPrice instanceof Decimal ? exitPrice : new Decimal(exitPrice);
  const qty = typeof quantity === 'string' ? new Decimal(quantity) : quantity instanceof Decimal ? quantity : new Decimal(quantity);

  if (side === 'BUY') {
    return exit.minus(entry).times(qty);
  } else {
    return entry.minus(exit).times(qty);
  }
}

export function calculatePercentageChange(
  from: number | string | Decimal,
  to: number | string | Decimal
): Decimal {
  const fromVal = typeof from === 'string' ? new Decimal(from) : from instanceof Decimal ? from : new Decimal(from);
  const toVal = typeof to === 'string' ? new Decimal(to) : to instanceof Decimal ? to : new Decimal(to);

  if (fromVal.isZero()) return new Decimal(0);
  return toVal.minus(fromVal).div(fromVal).times(100);
}

export function calculateFee(
  amount: number | string | Decimal,
  feeRateBps: number
): Decimal {
  const amt = typeof amount === 'string' ? new Decimal(amount) : amount instanceof Decimal ? amount : new Decimal(amount);
  return amt.times(feeRateBps).div(10000);
}

export function calculatePositionSize(
  accountBalance: number | string | Decimal,
  riskPercent: number,
  entryPrice: number | string | Decimal,
  stopLossPrice: number | string | Decimal
): Decimal {
  const balance = typeof accountBalance === 'string' ? new Decimal(accountBalance) : accountBalance instanceof Decimal ? accountBalance : new Decimal(accountBalance);
  const entry = typeof entryPrice === 'string' ? new Decimal(entryPrice) : entryPrice instanceof Decimal ? entryPrice : new Decimal(entryPrice);
  const stop = typeof stopLossPrice === 'string' ? new Decimal(stopLossPrice) : stopLossPrice instanceof Decimal ? stopLossPrice : new Decimal(stopLossPrice);

  const riskAmount = balance.times(riskPercent).div(100);
  const riskPerUnit = entry.minus(stop).abs();

  if (riskPerUnit.isZero()) return new Decimal(0);

  return riskAmount.div(riskPerUnit);
}