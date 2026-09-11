# Codex Trading

**Intelligent Crypto Trading. Simplified.**

A next-generation crypto trading and market intelligence platform. Currently a **simulated/demo trading environment** designed for investor demonstration.

> ⚠️ **DEMO PLATFORM — SIMULATED TRADING — NO REAL MONEY**

## Features

- Professional exchange dashboard
- Live simulated market data
- Animated candlestick charts
- Simulated order book
- Buy/Sell trading interface
- Simulated order execution
- Portfolio management
- Wallet balances
- Trade history
- Open orders
- P&L calculations
- Market statistics
- Notifications
- User profile & security
- Admin dashboard
- Codex AI assistant architecture
- Fully responsive interface
- Docker support
- PostgreSQL + Prisma

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, TanStack Query, Zustand, Recharts
- **Backend:** Node.js, Express, TypeScript, Socket.IO, Prisma
- **Database:** PostgreSQL
- **AI:** OpenAI GPT-5.6 integration
- **Infrastructure:** Docker, Docker Compose

## Project Structure

```
codex-trading/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/
│   ├── database/     # Prisma schema & client
│   ├── shared/       # Shared utilities
│   ├── config/       # Environment config
│   └── types/        # TypeScript types
├── prisma/           # Database schema
├── docker/           # Docker configs
└── docs/             # Documentation
```

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 15
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd codex-trading

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Update .env with your configuration
# Required: DATABASE_URL, JWT_SECRET

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development servers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- WebSocket: ws://localhost:4000

### Docker

```bash
# Start all services
docker compose up --build

# Stop services
docker compose down
```

## Demo Credentials

**Demo User:**
- Email: `demo@codextrading.local`
- Password: `DemoPass123!`

**Admin User:**
- Email: `admin@codextrading.local`
- Password: `AdminPass123!`

## Available Scripts

```bash
# Development
npm run dev                    # Start both frontend and backend
npm run dev --workspace=apps/api   # Start backend only
npm run dev --workspace=apps/web   # Start frontend only

# Building
npm run build                  # Build all packages
npm run build:api              # Build backend
npm run build:web              # Build frontend

# Database
npm run db:generate            # Generate Prisma client
npm run db:migrate             # Run migrations
npm run db:seed                # Seed demo data
npm run db:studio              # Open Prisma Studio
npm run demo:reset             # Reset demo environment

# Testing
npm test                       # Run all tests
npm run lint                   # Run linter

# Docker
docker compose build           # Build Docker images
docker compose up              # Start services
docker compose down            # Stop services
docker compose logs -f         # View logs
```

## Architecture

### Backend

```
apps/api/src/
├── config/           # Configuration
├── controllers/      # Request handlers
├── routes/           # API routes
├── services/         # Business logic
├── engines/          # Market & order engines
├── middleware/       # Express middleware
├── websocket/        # WebSocket server
├── validators/       # Input validation
└── server.ts         # Entry point
```

### Frontend

```
apps/web/src/
├── app/              # Next.js pages
├── components/       # React components
├── lib/              # Utilities
├── hooks/            # Custom hooks
├── stores/           # State management
└── types/            # TypeScript types
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Markets
- `GET /api/markets/pairs` - Get all trading pairs
- `GET /api/markets/tickers` - Get all tickers
- `GET /api/markets/tickers/:symbol` - Get ticker for symbol
- `GET /api/markets/candles/:symbol` - Get candlestick data
- `GET /api/markets/orderbook/:symbol` - Get order book
- `GET /api/markets/trades/:symbol` - Get recent trades
- `GET /api/markets/stats` - Get market statistics

### Trading
- `GET /api/orders` - Get user orders
- `GET /api/orders/open` - Get open orders
- `GET /api/orders/history` - Get order history
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `DELETE /api/orders/:id` - Cancel order

### Wallet
- `GET /api/wallet/balances` - Get wallet balances
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/deposit` - Simulated deposit
- `POST /api/wallet/withdraw` - Simulated withdrawal

### Portfolio
- `GET /api/portfolio/summary` - Get portfolio summary
- `GET /api/portfolio/chart` - Get portfolio chart data
- `GET /api/portfolio/pnl` - Get P&L data

### AI
- `POST /api/ai/ask` - Ask Codex AI
- `GET /api/ai/conversations` - Get conversations
- `GET /api/ai/analysis/:symbol` - Get AI analysis

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Manage users
- `GET /api/admin/markets` - Manage markets
- `GET /api/admin/simulator` - Simulator controls
- `POST /api/admin/demo` - Demo controls

## WebSocket Events

### Client -> Server
- `subscribe` - Subscribe to channels
- `unsubscribe` - Unsubscribe from channels
- `ping` - Ping server

### Server -> Client
- `market:ticker` - Market ticker updates
- `market:candle` - Candle updates
- `market:orderbook` - Order book updates
- `market:trade` - Recent trade updates
- `order:updated` - Order status updates
- `portfolio:updated` - Portfolio updates
- `notification:new` - New notifications
- `alert:triggered` - Price alert triggered

## Environment Variables

See `.env.example` for all available environment variables.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)

Optional variables:
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `DEMO_MODE` - Enable demo mode (default: true)
- `MARKET_VOLATILITY` - Market volatility (default: 0.02)
- `MAKER_FEE_BPS` - Maker fee in basis points (default: 10)
- `TAKER_FEE_BPS` - Taker fee in basis points (default: 10)

## Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test --workspace=apps/api

# Run frontend tests
npm run test --workspace=apps/web
```

## Demo Mode

The platform runs in demo mode by default. Demo mode:
- Uses simulated market data
- No real blockchain transactions
- Pre-seeded demo user with simulated balances
- All trading is simulated

To disable demo mode, set `DEMO_MODE=false` in `.env`.

## Roadmap

### Phase 1: Demo Exchange (Current)
- ✅ Simulated market engine
- ✅ Order book & charts
- ✅ Trading interface
- ✅ Portfolio management
- ✅ User authentication
- ✅ Admin dashboard

### Phase 2: Advanced Market Intelligence (Planned)
- Advanced technical indicators
- Market sentiment analysis
- Advanced charting tools

### Phase 3: Codex AI (Planned)
- Real OpenAI integration
- AI-powered market analysis
- Portfolio optimization suggestions

### Phase 4: Algorithmic Trading (Roadmap)
- Trading bot framework
- Strategy backtesting
- Automated execution

### Phase 5: Institutional Tools (Roadmap)
- Multi-user accounts
- Advanced risk management
- Institutional reporting

## Security

- Password hashing with bcrypt
- JWT-based authentication
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention via Prisma
- XSS-safe rendering
- Audit logging

## Disclaimer

This is a **demo platform for investor demonstration**. No real cryptocurrency deposits, withdrawals, or trading occur. All market data, balances, and trades are simulated.

## License

MIT

## Support

For questions or support, please contact the development team.