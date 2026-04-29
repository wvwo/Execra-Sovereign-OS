import { Router } from 'express';
import { prisma } from '../utils/prismaClient';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [workflows, executions, prevExecutions] = await Promise.all([
      prisma.workflow.findMany({
        where: { userId },
        select: { id: true, title: true, runCount: true, successRate: true, avgDurationMs: true, status: true },
      }),
      prisma.execution.findMany({
        where: { workflow: { userId }, createdAt: { gte: thirtyDaysAgo } },
        select: { status: true, durationMs: true, createdAt: true, workflowId: true },
      }),
      prisma.execution.findMany({
        where: { workflow: { userId }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        select: { status: true },
      }),
    ]);

    const totalRuns = executions.length;
    const totalRunsPrev = prevExecutions.length;
    const successRuns = executions.filter((e) => e.status === 'success').length;
    const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;
    const activeWorkflows = workflows.filter((w) => w.status === 'active').length;
    const hoursSaved = Math.round((totalRuns * 5) / 60);

    const dailyMap = new Map<string, { runs: number; success: number; failed: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dailyMap.set(d.toISOString().slice(0, 10), { runs: 0, success: 0, failed: 0 });
    }
    executions.forEach((e) => {
      const key = new Date(e.createdAt).toISOString().slice(0, 10);
      if (dailyMap.has(key)) {
        const day = dailyMap.get(key)!;
        day.runs++;
        if (e.status === 'success') day.success++;
        else if (e.status === 'failed' || e.status === 'failure') day.failed++;
      }
    });

    const dailyRuns = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .reverse();

    const topWorkflows = workflows
      .sort((a, b) => b.runCount - a.runCount)
      .slice(0, 5)
      .map((w) => ({ id: w.id, title: w.title, runCount: w.runCount, successRate: w.successRate }));

    res.json({
      totalRuns,
      totalRunsPrev,
      successRate,
      hoursSaved,
      activeWorkflows,
      recordsProcessed: totalRuns * 12,
      dailyRuns,
      topWorkflows,
      stepFailures: [],
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
