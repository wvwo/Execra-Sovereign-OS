// Set env vars BEFORE any imports so module-level validation passes
process.env.JWT_SECRET = 'test-super-secret-key-at-least-32-chars!!';

import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../src/utils/prismaClient', () => ({
  prisma: {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: '123', email: 'u@test.com', name: 'U', role: 'user' }),
    },
  },
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {}, cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 401 if no token provided', async () => {
    await authenticate(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('should call next if valid token is provided in header', async () => {
    req.headers!.authorization = 'Bearer valid-token-long-enough';
    (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('123');
  });
});
