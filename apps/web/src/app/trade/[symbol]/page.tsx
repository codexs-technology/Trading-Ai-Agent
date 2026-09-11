'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { useToaster } from '@/components/toaster-provider';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('codex-auth');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function TradePage({ params }: { params: { symbol: string } }) {
  const router = useRouter();
  const { symbol } = params;
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { addToast } = useToaster();

  const { data: ticker, isLoading: tickerLoading } = useQuery({
    queryKey: ['ticker', symbol],
    queryFn: () => fetchWithAuth(`/api/markets/tickers/${symbol}`),
    refetchInterval: 2000,
  });

  const { data: orderbook } = useQuery({
    queryKey: ['orderbook', symbol],
    queryFn: () => fetchWithAuth(`/api/markets/orderbook/${symbol}?depth=20`),
    refetchInterval: 2000,
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['trades', symbol],
    queryFn: () => fetchWithAuth(`/api/markets/trades/${symbol}?limit=20`),
    refetchInterval: 2000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('codex-auth');
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol,
          side,
          type: orderType,
          price: orderType === 'LIMIT' ? parseFloat(price) : undefined,
          quantity: parseFloat(quantity),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Order failed');
      }

      addToast({
        title: 'Order Submitted',
        description: `Your ${side} order for ${quantity} ${symbol.split('/')[0]} has been placed.`,
        variant: 'success',
      });

      setQuantity('');
      setPrice('');
    } catch (error) {
      addToast({
        title: 'Order Failed',
        description: error instanceof Error ? error.message : 'Failed to place order',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{symbol.replace('/', ' / ')}</h1>
        {ticker && (
          <div className="flex items-center gap-4 mt-2">
            <span className="text-2xl font-bold">
              ${ticker.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`flex items-center gap-1 ${ticker.changePct24h >= 0 ? 'text-success' : 'text-danger'}`}>
              {ticker.changePct24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {ticker.changePct24h >= 0 ? '+' : ''}
              {ticker.changePct24h?.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Book</CardTitle>
            </CardHeader>
            <CardContent>
              {orderbook ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Asks</div>
                    <div className="space-y-1">
                      {orderbook.asks?.slice(0, 10).reverse().map((ask: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-danger">${ask.price.toFixed(2)}</span>
                          <span className="text-muted-foreground">{ask.quantity.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Bids</div>
                    <div className="space-y-1">
                      {orderbook.bids?.slice(0, 10).map((bid: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-success">${bid.price.toFixed(2)}</span>
                          <span className="text-muted-foreground">{bid.quantity.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading order book...</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTrades ? (
                <div className="space-y-1">
                  {recentTrades.slice(0, 15).map((trade: any) => (
                    <div key={trade.id} className="flex justify-between text-sm">
                      <span className={trade.side === 'BUY' ? 'text-success' : 'text-danger'}>
                        ${trade.price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">{trade.quantity.toFixed(4)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading trades...</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex rounded-md overflow-hidden border border-border">
                  <button
                    type="button"
                    onClick={() => setSide('BUY')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      side === 'BUY' ? 'bg-success text-success-foreground' : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide('SELL')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      side === 'SELL' ? 'bg-danger text-danger-foreground' : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                <div className="flex rounded-md overflow-hidden border border-border">
                  <button
                    type="button"
                    onClick={() => setOrderType('MARKET')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      orderType === 'MARKET' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('LIMIT')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      orderType === 'LIMIT' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    Limit
                  </button>
                </div>

                {orderType === 'LIMIT' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className={`w-full ${side === 'BUY' ? 'bg-success hover:bg-success/90' : 'bg-danger hover:bg-danger/90'}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : `${side} ${symbol.split('/')[0]}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}