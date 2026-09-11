'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, setAuth, logout } = useAuthStore();

  useEffect(() => {
    // Check for token in localStorage on mount
    const storedToken = localStorage.getItem('codex-auth');
    if (storedToken && !user) {
      // In a real app, you'd validate the token here
      // For demo purposes, we'll just set the auth
      const storedUser = localStorage.getItem('codex-auth-user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setAuth(userData, storedToken);
        } catch {
          logout();
        }
      }
    }
  }, [user, setAuth, logout]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !token) {
      // Don't redirect on landing page and login/register pages
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path !== '/' && path !== '/login' && path !== '/register') {
          router.push('/login');
        }
      }
    }
  }, [user, token, router]);

  return <>{children}</>;
}