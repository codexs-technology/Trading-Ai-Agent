export function generateId(): string {
  return crypto.randomUUID();
}

export function generateClientOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `CODEX_${timestamp}_${random}`.toUpperCase();
}

export function generateOrderId(): string {
  return `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`.toUpperCase();
}

export function generateTradeId(): string {
  return `TRD_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`.toUpperCase();
}