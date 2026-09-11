'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Profile page - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}