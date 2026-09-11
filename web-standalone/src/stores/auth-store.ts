'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'Invalid credentials');
          }

          set({ user: data.user, token: data.accessToken, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      register: async (email, password, firstName, lastName) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          set({ user: data.user, token: data.accessToken, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      setAuth: (user, token) => set({ user, token, isLoading: false }),
      logout: () => set({ user: null, token: null, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'codex-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);