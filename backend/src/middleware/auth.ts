import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prismaClient';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be set and at least 32 characters');
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// Augment Express Request so all route handlers see req.user without casting
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// AuthRequest is kept for backward compatibility with files that import it
export type AuthRequest = Request;

export function setAuthCookie(res: Response, userId: string): string {
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '24h',
    algorithm: 'HS256',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  return token;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Accept cookie OR Authorization header (Bearer) — cookie takes precedence
    const raw = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!raw || typeof raw !== 'string' || raw.length < 10) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(raw, JWT_SECRET, { algorithms: ['HS256'] }) as { userId: string };
    } catch {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (!decoded.userId || typeof decoded.userId !== 'string') {
      return res.status(401).json({ error: 'Malformed token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Role guard — use after authenticate
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function logout(_req: Request, res: Response) {
  res.clearCookie('token', { path: '/' });
  res.json({ status: 'logged_out' });
}
