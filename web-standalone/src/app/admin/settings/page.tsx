'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Settings</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">System settings - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}