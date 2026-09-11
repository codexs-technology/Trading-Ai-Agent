'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('codex-auth');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function PortfolioPage() {
  const { data: summary } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () => fetchWithAuth('/api/portfolio/summary'),
    refetchInterval: 5000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['portfolio-chart'],
    queryFn: () => fetchWithAuth('/api/portfolio/chart?timeframe=1M'),
    refetchInterval: 30000,
  });

  const pnl = summary?.totalPnl || 0;
  const pnlPct = summary?.totalPnlPct || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground mt-1">Track your performance</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary?.totalBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.todayPnl || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
              {summary?.todayPnl ? `$${summary.todayPnl.toFixed(2)}` : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">{summary?.todayPnlPct?.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
              ${pnl.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{pnlPct.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.winRate?.toFixed(1) || '0.0'}%</div>
            <p className="text-xs text-muted-foreground">{summary?.totalTrades || 0} trades</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary?.assetAllocation?.map((asset: any) => (
              <div key={asset.asset} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                    {asset.asset[0]}
                  </div>
                  <div>
                    <div className="font-medium">{asset.asset}</div>
                    <div className="text-sm text-muted-foreground">{asset.percentage.toFixed(2)}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${asset.value.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}