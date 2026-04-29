import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { aiAssist } from '../services/llm';

const router = Router();

const AIAssistSchema = z.object({
  message: z.string().min(1).max(2000),
  workflow: z.record(z.unknown()).optional(),
  context: z.string().max(4000).optional(),
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const parsed = AIAssistSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' });
  }

  const { message, workflow, context } = parsed.data;

  try {
    const result = await aiAssist(workflow, message, context);
    res.json(result);
  } catch (error) {
    console.error('AI assist error:', error);
    res.status(500).json({ error: 'AI assistant failed to respond' });
  }
});

export default router;
