'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('codex-auth');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function MarketsPage() {
  const { data: markets, isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: () => fetchWithAuth('/api/markets/stats'),
    refetchInterval: 3000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Markets</h1>
        <p className="text-muted-foreground mt-1">Live simulated market data</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading markets...</div>
        ) : (
          markets?.map((market: any) => (
            <Link key={market.symbol} href={`/trade/${market.symbol.replace('/', '')}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{market.symbol}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    ${market.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${market.changePct24h >= 0 ? 'text-success' : 'text-danger'}`}>
                    {market.changePct24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {market.changePct24h >= 0 ? '+' : ''}
                    {market.changePct24h?.toFixed(2)}%
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <div>24h High: ${market.high24h?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div>24h Low: ${market.low24h?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div>Volume: {market.volume24h?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}