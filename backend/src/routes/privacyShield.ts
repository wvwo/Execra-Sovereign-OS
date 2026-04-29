import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { redactPII, containsPII } from '../services/privacyShield';
import { prisma } from '../utils/prismaClient';

const router = Router();

// Redact text and log the operation
router.post('/redact', authenticate, async (req: Request, res: Response) => {
  const schema = z.object({ text: z.string().min(1).max(50000), workflowId: z.string().uuid().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const report = redactPII(parsed.data.text);

  if (report.redactionCount > 0) {
    await prisma.piiRedactionLog.create({
      data: {
        workflowId: parsed.data.workflowId,
        redactionCount: report.redactionCount,
        types: [...new Set(report.redactedItems.map((i) => i.type))],
        originalHash: report.originalHash,
      },
    });
  }

  res.json({
    redactedText: report.redactedText,
    redactionCount: report.redactionCount,
    types: [...new Set(report.redactedItems.map((i) => i.type))],
    originalHash: report.originalHash,
  });
});

// Check if text contains PII (without logging)
router.post('/check', authenticate, async (req: Request, res: Response) => {
  const schema = z.object({ text: z.string().min(1).max(50000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  res.json({ hasPII: containsPII(parsed.data.text) });
});

// Get redaction history (last 20)
router.get('/logs', authenticate, async (_req: Request, res: Response) => {
  const logs = await prisma.piiRedactionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(logs);
});

// Get total redaction stats
router.get('/stats', authenticate, async (_req: Request, res: Response) => {
  const result = await prisma.piiRedactionLog.aggregate({
    _sum: { redactionCount: true },
    _count: { id: true },
  });
  res.json({
    totalRedactions: result._sum.redactionCount ?? 0,
    totalOperations: result._count.id,
  });
});

export default router;
