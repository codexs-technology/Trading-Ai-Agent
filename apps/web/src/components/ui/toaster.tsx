'use client';

import * as React from 'react';
import { Toast } from '@/components/ui/toast';
import { useToaster } from '@/components/toaster-provider';

export function Toaster() {
  const { toasts, removeToast } = useToaster();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onClose={() => removeToast(toast.id)}
        >
          {toast.title && <div className="font-semibold">{toast.title}</div>}
          {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
        </Toast>
      ))}
    </div>
  );
}