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

export default function AdminMarketsPage() {
  const { data: pairs, isLoading } = useQuery({
    queryKey: ['admin-markets'],
    queryFn: () => fetchWithAuth('/api/markets/pairs'),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Market Management</h1>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading markets...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4">Symbol</th>
                    <th className="text-left py-2 px-4">Base</th>
                    <th className="text-left py-2 px-4">Quote</th>
                    <th className="text-left py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs?.map((pair: any) => (
                    <tr key={pair.id} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium">{pair.symbol}</td>
                      <td className="py-3 px-4">{pair.baseAsset}</td>
                      <td className="py-3 px-4">{pair.quoteAsset}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${pair.isActive ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                          {pair.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
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