'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('codex-auth');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchWithAuth('/api/orders'),
    refetchInterval: 5000,
  });

  const orders = data?.orders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage your orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No open orders</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4">Symbol</th>
                    <th className="text-left py-2 px-4">Side</th>
                    <th className="text-left py-2 px-4">Type</th>
                    <th className="text-right py-2 px-4">Price</th>
                    <th className="text-right py-2 px-4">Quantity</th>
                    <th className="text-right py-2 px-4">Filled</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/50">
                      <td className="py-3 px-4 font-medium">{order.symbol}</td>
                      <td className={`py-3 px-4 ${order.side === 'BUY' ? 'text-success' : 'text-danger'}`}>
                        {order.side}
                      </td>
                      <td className="py-3 px-4">{order.type}</td>
                      <td className="py-3 px-4 text-right">{order.price ? `$${order.price.toFixed(2)}` : '-'}</td>
                      <td className="py-3 px-4 text-right">{order.quantity.toFixed(4)}</td>
                      <td className="py-3 px-4 text-right">{order.filledQty.toFixed(4)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'FILLED' ? 'bg-success/20 text-success' :
                          order.status === 'OPEN' ? 'bg-warning/20 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}