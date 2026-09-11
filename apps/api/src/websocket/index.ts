import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@codex-trading/database';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  role?: string;
}

const io = new SocketIOServer({
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
});

io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(new Error('Invalid or expired token'));
    }

    socket.userId = user.id;
    socket.email = user.email;
    socket.role = user.role;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket: AuthenticatedSocket) => {
  console.log(`WebSocket client connected: ${socket.id} (user: ${socket.email})`);

  socket.on('subscribe', async (data) => {
    try {
      const { channels, symbols } = data;

      if (symbols && Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.join(`market:${symbol}`);
        });
      }

      if (channels && Array.isArray(channels)) {
        channels.forEach(channel => {
          socket.join(channel);
        });
      }

      socket.emit('subscribed', { channels, symbols });
    } catch (error) {
      socket.emit('error', { message: 'Failed to subscribe' });
    }
  });

  socket.on('unsubscribe', (data) => {
    const { channels, symbols } = data;

    if (symbols && Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        socket.leave(`market:${symbol}`);
      });
    }

    if (channels && Array.isArray(channels)) {
      channels.forEach(channel => {
        socket.leave(channel);
      });
    }
  });

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

io.on('error', (error) => {
  console.error('WebSocket error:', error);
});

export { io as getIO };
export function emitToUser(userId: string, event: string, data: unknown): void {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToSymbol(symbol: string, event: string, data: unknown): void {
  io.to(`market:${symbol}`).emit(event, data);
}

export function broadcast(event: string, data: unknown): void {
  io.emit(event, data);
}

export function setupWebSocket(server: import('http').Server): void {
  io.attach(server);
}
