import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prismaClient';
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing');
}

export interface AuthRequest extends Request {
  user?: any;
}

// Generate token and set httpOnly cookie
export function setAuthCookie(res: Response, userId: string): string {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
  
  res.cookie('token', token, {
    httpOnly: true,        // Cannot be accessed by JavaScript (prevents XSS)
    secure: true,          // Only sent over HTTPS
    sameSite: 'strict',    // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  });
  
  return token;
}

// Verify token from cookie (not header)
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    
    if (!user) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Logout endpoint
export function logout(req: AuthRequest, res: Response) {
  res.clearCookie('token', { path: '/' });
  res.json({ status: 'logged_out' });
}
