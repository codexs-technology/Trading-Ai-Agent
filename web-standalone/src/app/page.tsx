import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, Zap, Bot, Globe, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl">Codex Trading</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block bg-warning/10 text-warning px-4 py-2 rounded-full text-sm font-medium mb-8">
              DEMO PLATFORM — SIMULATED TRADING
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              Intelligent Crypto Trading.
              <br />
              <span className="text-primary">Simplified.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A next-generation crypto trading and market intelligence platform.
              Experience professional trading with AI-powered insights in our simulated demo environment.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
                Launch Demo
                <ArrowRight className="ml-2 inline-block" size={20} />
              </Link>
              <Link href="/markets" className="btn-secondary text-lg px-8 py-3">
                Explore Platform
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Professional Trading Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card p-6">
                <BarChart3 className="text-primary mb-4" size={32} />
                <h3 className="font-semibold text-lg mb-2">Live Market Data</h3>
                <p className="text-muted-foreground">
                  Real-time candlestick charts, order books, and market statistics for BTC, ETH, SOL, and more.
                </p>
              </div>
              <div className="card p-6">
                <Zap className="text-primary mb-4" size={32} />
                <h3 className="font-semibold text-lg mb-2">Lightning Fast Execution</h3>
                <p className="text-muted-foreground">
                  Simulated market orders and limit orders with real-time execution and instant trade confirmations.
                </p>
              </div>
              <div className="card p-6">
                <Bot className="text-primary mb-4" size={32} />
                <h3 className="font-semibold text-lg mb-2">AI Trading Assistant</h3>
                <p className="text-muted-foreground">
                  Codex AI provides market analysis and insights. Get intelligent trading information through natural language.
                </p>
              </div>
              <div className="card p-6">
                <Shield className="text-primary mb-4" size={32} />
                <h3 className="font-semibold text-lg mb-2">Portfolio Management</h3>
                <p className="text-muted-foreground">
                  Track your portfolio performance with detailed P&L analytics, win rates, and asset allocation charts.
                </p>
              </div>
              <div className="card p-6">
                <Globe className="text-primary mb-4" size={32} />
                <h3 className="font-semibold text-lg mb-2">Multiple Trading Pairs</h3>
                <p className="text-muted-foreground">
                  Trade BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT, DOGE/USDT, ADA/USDT and more.
                </p>
              </div>
              <div className="card p-6">
                <Lock className="text-primary mb-4" size={32} />
                <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Industry-standard security with password hashing, secure sessions, and encrypted API communication.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Experience the future of crypto trading with our intelligent platform.
            </p>
            <div className="inline-block bg-warning/10 text-warning px-4 py-2 rounded-full text-sm font-medium mb-8">
              DEMO PLATFORM — SIMULATED TRADING — NO REAL MONEY
            </div>
            <div>
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
                Launch Demo
                <ArrowRight className="ml-2 inline-block" size={20} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Codex Trading. All rights reserved.</p>
          <p className="text-sm mt-2">
            This is a demo platform for investor demonstration. No real trading. No real money.
          </p>
        </div>
      </footer>
    </div>
  );
}