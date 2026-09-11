'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, BarChart3, Bot } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('codex-auth');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () => fetchWithAuth('/api/portfolio/summary'),
    refetchInterval: 5000,
  });

  const { data: markets } = useQuery({
    queryKey: ['markets'],
    queryFn: () => fetchWithAuth('/api/markets/tickers'),
    refetchInterval: 2000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchWithAuth('/api/notifications'),
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.email?.split('@')[0] || 'Trader'}
          </h1>
          <p className="text-muted-foreground mt-1">Here's your portfolio overview</p>
        </div>
        <div className="inline-block bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">
          DEMO MODE — SIMULATED
        </div>
      </div>

      {portfolioLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolio?.totalBalance ? `$${portfolio.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">USDT equivalent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolio?.todayPnl && portfolio.todayPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                {portfolio?.todayPnl ? `$${portfolio.todayPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {portfolio?.todayPnlPct ? `${portfolio.todayPnlPct >= 0 ? '+' : ''}${portfolio.todayPnlPct.toFixed(2)}%` : '0.00%'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolio?.totalPnl && portfolio.totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                {portfolio?.totalPnl ? `$${portfolio.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {portfolio?.totalPnlPct ? `${portfolio.totalPnlPct >= 0 ? '+' : ''}${portfolio.totalPnlPct.toFixed(2)}%` : '0.00%'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio?.winRate ? `${portfolio.winRate.toFixed(1)}%` : '0.0%'}</div>
              <p className="text-xs text-muted-foreground mt-1">{portfolio?.totalTrades || 0} total trades</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {markets?.map((market: any) => (
                  <Link
                    key={market.symbol}
                    href={`/trade/${market.symbol.replace('/', '')}`}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-secondary transition-colors"
                  >
                    <div>
                      <div className="font-medium">{market.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        ${market.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${market.changePct24h >= 0 ? 'text-success' : 'text-danger'}`}>
                      {market.changePct24h >= 0 ? '+' : ''}
                      {market.changePct24h?.toFixed(2)}%
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Codex AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get AI-powered market analysis and trading insights.
              </p>
              <Link href="/ai">
                <Button className="w-full">
                  <Bot className="mr-2" size={16} />
                  Ask Codex AI
                </Button>
              </Link>
            </CardContent>
          </Card>

          {notifications && notifications.notifications?.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Notifications
                  {notifications.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                      {notifications.unreadCount}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.notifications.slice(0, 3).map((notif: any) => (
                    <div key={notif.id} className="text-sm p-2 rounded bg-secondary">
                      <div className="font-medium">{notif.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{notif.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}