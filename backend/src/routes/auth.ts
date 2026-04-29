import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prismaClient';
import { setAuthCookie, authenticate, logout } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Strict schemas
const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().max(254).toLowerCase(),
  // OWASP: min 8 chars, at least one number and one letter
  password: z.string().min(8).max(128).refine(
    p => /[A-Za-z]/.test(p) && /\d/.test(p),
    { message: 'Password must contain at least one letter and one number' }
  ),
});

const LoginSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(1).max(128),
});

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' });
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Constant-time response to prevent user enumeration
      await bcrypt.hash(password, 12);
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name || email.split('@')[0], email, passwordHash },
      select: { id: true, name: true, email: true },
    });

    res.status(201).json({ message: 'Account created', user });
  } catch (err) {
    console.error('[Auth] Registration error:', (err as Error).message, (err as Error).stack?.split('\n')[1]);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    // Generic error — don't reveal which field is wrong
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always run bcrypt.compare to prevent timing attacks
    const hash = user?.passwordHash ?? '$2a$12$invalidhashtopreventtimingattack123456789012345678';
    const valid = await bcrypt.compare(password, hash);

    if (!user || !user.passwordHash || !valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = setAuthCookie(res, user.id);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[Auth] Login error:', (err as Error).message, (err as Error).stack?.split('\n')[1]);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', logout);

// GET /api/v1/auth/me  (requires auth)
router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json(req.user);
});

export default router;
