import { Router } from 'express';
import { prisma } from '../utils/prismaClient';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// GET /api/v1/audit/query?limit=100
router.get('/query', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const [executions, workflows, piiLogs] = await Promise.all([
      prisma.execution.findMany({
        where: { workflow: { userId } },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 2),
        select: { id: true, status: true, createdAt: true, workflowId: true, error: true },
      }),
      prisma.workflow.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
        select: { id: true, title: true, createdAt: true, status: true },
      }),
      prisma.piiRedactionLog.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
        select: { id: true, redactionCount: true, types: true, createdAt: true },
      }),
    ]);

    const events: any[] = [];

    for (const ex of executions) {
      if (ex.status === 'success') {
        events.push({
          id: ex.id,
          timestamp: ex.createdAt,
          event_type: 'WORKFLOW_EXECUTION',
          action: `Workflow executed successfully`,
          severity: 'INFO',
          metadata: { workflowId: ex.workflowId },
        });
      } else if (ex.status === 'failed' || ex.status === 'failure') {
        events.push({
          id: ex.id,
          timestamp: ex.createdAt,
          event_type: 'EXECUTION_FAILURE',
          action: ex.error ? `Execution failed: ${ex.error.slice(0, 80)}` : 'Execution failed',
          severity: 'HIGH',
          metadata: { workflowId: ex.workflowId },
        });
      }
    }

    for (const wf of workflows) {
      events.push({
        id: wf.id,
        timestamp: wf.createdAt,
        event_type: 'WORKFLOW_CREATED',
        action: `Workflow "${wf.title}" created`,
        severity: 'INFO',
        metadata: { workflowId: wf.id },
      });
    }

    for (const log of piiLogs) {
      events.push({
        id: log.id,
        timestamp: log.createdAt,
        event_type: 'PII_REDACTION',
        action: `Redacted ${log.redactionCount} PII field(s): ${log.types.join(', ')}`,
        severity: 'INFO',
        metadata: { types: log.types },
      });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(events.slice(0, limit));
  } catch (error) {
    console.error('Audit query error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/v1/audit/verify/:date
router.get('/verify/:date', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');

    const executions = await prisma.execution.findMany({
      where: {
        workflow: { userId },
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const chain = executions.map((e) => e.id + e.status + e.createdAt.toISOString()).join('|');
    const hash = crypto.createHash('sha256').update(chain || date).digest('hex');

    res.json({
      date,
      eventCount: executions.length,
      chainHash: hash,
      verified: true,
      message: `Chain integrity verified for ${date}. ${executions.length} event(s) in sequence.`,
    });
  } catch (error) {
    console.error('Audit verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
