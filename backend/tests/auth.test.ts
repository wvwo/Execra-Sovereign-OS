process.env.JWT_SECRET = 'test-secret';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../src/utils/prismaClient', () => ({
  prisma: {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: '123' })
    }
  }
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should return 401 if no token provided', async () => {
    await authenticate(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized - No token provided' });
  });

  it('should call next if valid token is provided in header', async () => {
    req.headers!.authorization = 'Bearer valid-token';
    (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('123');
  });
});
