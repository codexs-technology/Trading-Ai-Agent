'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        success: 'border-success bg-success/10 text-success-foreground',
        error: 'border-danger bg-danger/10 text-danger-foreground',
        warning: 'border-warning bg-warning/10 text-warning-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  onClose?: () => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ className, variant, onClose, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn(toastVariants({ variant, className }))} {...props}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});
Toast.displayName = 'Toast';

export { Toast, toastVariants };