import { Router } from 'express';
import { prisma } from '../utils/prismaClient';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const CategorySchema = z.object({
  category: z.string().max(64).optional(),
});

// Public — template marketplace browsing
router.get('/', async (req, res) => {
  const parsed = CategorySchema.safeParse(req.query);
  const where = parsed.success && parsed.data.category
    ? { category: parsed.data.category }
    : {};

  try {
    const templates = await prisma.template.findMany({
      where,
      orderBy: { useCount: 'desc' },
    });
    res.json({ templates });
  } catch {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Public — single template preview
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Authenticated — import template into user's workflows
router.post('/:id/import', authenticate, async (req: AuthRequest, res) => {
  try {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const wfData = template.workflow as Record<string, unknown>;
    const workflow = await prisma.workflow.create({
      data: {
        userId: req.user!.id,
        title: `${template.name} (Import)`,
        description: template.description || '',
        startUrl: (wfData.startUrl as string) || (wfData.start_url as string) || 'https://',
        steps: (wfData.steps as object[]) || [],
        sessionId: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        tags: ['template', template.category.toLowerCase()],
        status: 'draft',
      },
    });

    // Increment use count — template is global, no userId scope needed
    await prisma.template.update({
      where: { id: req.params.id },
      data: { useCount: { increment: 1 } },
    });

    res.status(201).json({ workflow });
  } catch (error) {
    console.error('Template import error:', error);
    res.status(500).json({ error: 'Failed to import template' });
  }
});

export default router;
