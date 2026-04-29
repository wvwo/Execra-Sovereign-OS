import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prismaClient';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { evaluateTrigger, createTrigger } from '../services/triggerEngine';

const router = Router();

const triggerSchema = z.object({
  workflowId: z.string().uuid(),
  type: z.enum(['MANUAL', 'SCHEDULE', 'WEBHOOK', 'EMAIL', 'FILE_WATCH']),
  config: z.record(z.unknown()),
});

// List triggers for a workflow
router.get('/workflow/:workflowId', authenticate, async (req: AuthRequest, res: Response) => {
  const { workflowId } = req.params;
  const triggers = await prisma.trigger.findMany({
    where: { workflowId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(triggers);
});

// Create trigger
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const parsed = triggerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  // Verify workflow ownership
  const workflow = await prisma.workflow.findFirst({
    where: { id: parsed.data.workflowId, userId: req.user!.id },
  });
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

  const trigger = await createTrigger(
    parsed.data.workflowId,
    parsed.data.type,
    parsed.data.config as Record<string, unknown>
  );
  res.status(201).json(trigger);
});

// Toggle trigger active state
router.patch('/:id/toggle', authenticate, async (req: AuthRequest, res: Response) => {
  const trigger = await prisma.trigger.findUnique({ where: { id: req.params.id } });
  if (!trigger) return res.status(404).json({ error: 'Trigger not found' });

  const updated = await prisma.trigger.update({
    where: { id: req.params.id },
    data: { isActive: !trigger.isActive },
  });
  res.json(updated);
});

// Delete trigger
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.trigger.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Manually fire a trigger (for testing)
router.post('/:id/fire', authenticate, async (req: AuthRequest, res: Response) => {
  await evaluateTrigger(req.params.id, req.body);
  res.json({ status: 'queued' });
});

export default router;
