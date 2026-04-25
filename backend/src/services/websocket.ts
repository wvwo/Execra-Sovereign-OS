import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prismaClient';
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing');
}

let ioInstance: Server;

async function authenticateSocket(token: string) {
  if (!token) throw new Error('No token');
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) throw new Error('User not found');
  return user;
}

export function setupWebSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      // In production, parse cookies properly. For now we accept token from auth object.
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication failed: No token provided'));
      }
      const user = await authenticateSocket(token);
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.on('subscribe_execution', (executionId: string) => {
      socket.join(`execution:${executionId}`);
      console.log(`[WS] ${socket.id} subscribed to execution:${executionId}`);
    });

    socket.on('unsubscribe_execution', (executionId: string) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on('captcha_resolved', (data: { executionId: string; sessionId: string }) => {
      io.to(`execution:${data.executionId}`).emit('captcha_resolved', data);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIoInstance(): Server {
  if (!ioInstance) throw new Error('WebSocket not initialized');
  return ioInstance;
}

export function emitStepUpdate(executionId: string, data: any) {
  getIoInstance().to(`execution:${executionId}`).emit('step_update', data);
}

export function emitCaptchaDetected(executionId: string, data: any) {
  getIoInstance().to(`execution:${executionId}`).emit('captcha_detected', data);
}

export function emitExecutionComplete(executionId: string, data: any) {
  getIoInstance().to(`execution:${executionId}`).emit('execution_complete', data);
}
