'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Audit Logs</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Audit logs - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}