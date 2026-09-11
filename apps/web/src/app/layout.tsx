import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { AuthProvider } from '@/components/auth-provider';
import { ToasterProvider } from '@/components/toaster-provider';
import { Navbar } from '@/components/navbar';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Codex Trading',
    template: '%s | Codex Trading',
  },
  description: 'Intelligent Crypto Trading. Simplified.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            <AuthProvider>
              <ToasterProvider>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="container mx-auto px-4 py-6">{children}</main>
                </div>
              </ToasterProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}