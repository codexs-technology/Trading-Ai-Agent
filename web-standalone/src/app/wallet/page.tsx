'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('codex-auth');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function WalletPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => fetchWithAuth('/api/wallet/balances'),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-1">Manage your simulated assets</p>
      </div>

      <div className="inline-block bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">
        SIMULATED — NO REAL BLOCKCHAIN TRANSACTIONS
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading wallet...</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${data?.totalValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '$0.00'}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.balances?.map((balance: any) => (
              <Card key={balance.asset}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <WalletIcon size={20} />
                    {balance.asset}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Available</span>
                      <span className="font-medium">{balance.free.toFixed(8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Locked</span>
                      <span className="font-medium">{balance.locked.toFixed(8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-medium">{balance.total.toFixed(8)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Value</span>
                      <span className="font-bold">${balance.usdValue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}