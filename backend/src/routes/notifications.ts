import { Router } from 'express';
import { prisma } from '../utils/prismaClient';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.patch('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    // IDOR: verify ownership before mutating
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
