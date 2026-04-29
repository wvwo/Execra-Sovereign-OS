import { Router } from 'express';
import { prisma } from '../utils/prismaClient';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// ── AES-256-GCM encryption ─────────────────────────────────────────────────
const RAW_KEY = process.env.VARIABLE_ENCRYPTION_KEY;
if (!RAW_KEY || RAW_KEY.length < 32) {
  throw new Error('FATAL: VARIABLE_ENCRYPTION_KEY must be set and at least 32 characters');
}
const KEY = Buffer.from(RAW_KEY.slice(0, 32), 'utf8');

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 128-bit authentication tag
  // Format: iv(24 hex):tag(32 hex):ciphertext(hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivHex, tagHex, encHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

// ── Zod schemas ────────────────────────────────────────────────────────────
const CreateVariableSchema = z.object({
  name: z.string().trim().min(1).max(128).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'Variable name must be alphanumeric/underscore, starting with a letter or underscore',
  }),
  value: z.string().min(1).max(8192),
  isSecret: z.boolean().optional().default(false),
  description: z.string().max(512).optional(),
  environment: z.enum(['all', 'development', 'staging', 'production']).optional().default('all'),
});

const UpdateVariableSchema = z.object({
  value: z.string().min(1).max(8192),
  isSecret: z.boolean().optional(),
  description: z.string().max(512).optional(),
  environment: z.enum(['all', 'development', 'staging', 'production']).optional(),
});

// ── Routes ─────────────────────────────────────────────────────────────────

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const vars = await prisma.globalVariable.findMany({
      where: { userId: req.user!.id },
      orderBy: { name: 'asc' },
    });

    res.json({
      variables: vars.map((v) => ({ ...v, value: v.isSecret ? '••••••••' : v.value })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch variables' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const parsed = CreateVariableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' });
  }

  const { name, value, isSecret, description, environment } = parsed.data;

  try {
    const storedValue = isSecret ? encrypt(value) : value;
    const variable = await prisma.globalVariable.create({
      data: { userId: req.user!.id, name, value: storedValue, isSecret, description, environment },
    });

    res.status(201).json({ variable: { ...variable, value: isSecret ? '••••••••' : value } });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Variable with this name already exists' });
    res.status(500).json({ error: 'Failed to create variable' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  const parsed = UpdateVariableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' });
  }

  const { value, isSecret, description, environment } = parsed.data;

  try {
    // IDOR: verify ownership before mutating
    const existing = await prisma.globalVariable.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!existing) return res.status(404).json({ error: 'Variable not found' });

    const effectiveSecret = isSecret ?? existing.isSecret;
    const storedValue = effectiveSecret ? encrypt(value) : value;

    const variable = await prisma.globalVariable.update({
      where: { id: req.params.id },
      data: { value: storedValue, isSecret: effectiveSecret, description, environment },
    });

    res.json({ variable: { ...variable, value: effectiveSecret ? '••••••••' : value } });
  } catch {
    res.status(500).json({ error: 'Failed to update variable' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // IDOR: verify ownership before deleting
    const existing = await prisma.globalVariable.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!existing) return res.status(404).json({ error: 'Variable not found' });

    await prisma.globalVariable.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete variable' });
  }
});

router.get('/:id/reveal', authenticate, async (req: AuthRequest, res) => {
  try {
    // IDOR: findFirst with userId scope
    const variable = await prisma.globalVariable.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!variable) return res.status(404).json({ error: 'Variable not found' });

    const value = variable.isSecret ? decrypt(variable.value) : variable.value;
    res.json({ value });
  } catch {
    res.status(500).json({ error: 'Failed to reveal variable' });
  }
});

export default router;
