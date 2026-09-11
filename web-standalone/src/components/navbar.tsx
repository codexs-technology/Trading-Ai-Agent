'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Wallet,
  TrendingUp,
  Bell,
  User,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Bot,
  Home,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/markets', label: 'Markets', icon: TrendingUp },
  { href: '/trade/BTC/USDT', label: 'Trade', icon: BarChart3 },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/portfolio', label: 'Portfolio', icon: BarChart3 },
  { href: '/orders', label: 'Orders', icon: TrendingUp },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/ai', label: 'Codex AI', icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isLandingPage = pathname === '/';

  if (isLandingPage) return null;

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">Codex Trading</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Welcome,</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="relative group">
                  <Button variant="ghost" size="icon">
                    <User size={20} />
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="py-1">
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary">
                        <User size={16} />
                        Profile
                      </Link>
                      <Link href="/security" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary">
                        <Shield size={16} />
                        Security
                      </Link>
                      <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary">
                        <Settings size={16} />
                        Settings
                      </Link>
                      {user.role === 'ADMIN' && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary">
                          <BarChart3 size={16} />
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary w-full text-left text-danger"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              !isAuthPage && (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )
            )}

            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}