'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToaster } from '@/components/toaster-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('codex-auth');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToaster();
  const [showCreate, setShowCreate] = useState(false);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [targetValue, setTargetValue] = useState('');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetchWithAuth('/api/alerts'),
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('codex-auth');
      const res = await fetch(`${API_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol,
          condition: 'PRICE_ABOVE',
          targetValue: parseFloat(targetValue),
        }),
      });
      if (!res.ok) throw new Error('Failed to create alert');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setShowCreate(false);
      setTargetValue('');
      addToast({ title: 'Alert Created', description: `Price alert for ${symbol} created.`, variant: 'success' });
    },
    onError: () => {
      addToast({ title: 'Error', description: 'Failed to create alert', variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('codex-auth');
      const res = await fetch(`${API_URL}/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete alert');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      addToast({ title: 'Alert Deleted', variant: 'success' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Price Alerts</h1>
          <p className="text-muted-foreground mt-1">Set demo price alerts</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus size={16} className="mr-2" />
          New Alert
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="input"
                >
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="ETH/USDT">ETH/USDT</option>
                  <option value="SOL/USDT">SOL/USDT</option>
                  <option value="BNB/USDT">BNB/USDT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Enter price"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => createMutation.mutate()} disabled={!targetValue} className="w-full">
                  Create Alert
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
          ) : alerts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No alerts set</div>
          ) : (
            <div className="space-y-3">
              {alerts?.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-4 rounded-md border border-border">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-primary" />
                    <div>
                      <div className="font-medium">{alert.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        Price {alert.condition.replace('PRICE_', '').toLowerCase()} ${alert.targetValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(alert.id)}>
                    <Trash2 size={16} className="text-danger" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}