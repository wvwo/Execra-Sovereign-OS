import { Response } from 'express';
import { executeWorkflow } from '../services/execution';
import { validateWorkflow } from '../validators/workflowValidator';
import { prisma } from '../utils/prismaClient';
import { assertSafeUrl, sanitizeWorkflowUrls, SSRFError } from '../utils/ssrfGuard';
import type { AuthRequest } from '../middleware/auth';

export async function runWorkflow(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // IDOR: scope to requesting user
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    // Phase 7: SSRF protection — validate start_url and all navigate step URLs
    try {
      assertSafeUrl(workflow.startUrl);
      sanitizeWorkflowUrls(workflow.steps as unknown[]);
    } catch (err) {
      if (err instanceof SSRFError) {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }

    const validation = validateWorkflow({
      workflow_title: workflow.title,
      start_url: workflow.startUrl,
      session_id: workflow.sessionId,
      steps: workflow.steps,
    });

    if (!validation.isValid) {
      return res.status(400).json({ error: 'Workflow validation failed', validation });
    }

    const execution = await prisma.execution.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        startedAt: new Date(),
      },
    });

    executeWorkflow({
      workflow_title: workflow.title,
      start_url: workflow.startUrl,
      session_id: workflow.sessionId,
      workflow_id: workflow.id,
      steps: workflow.steps,
    })
      .then(async (result) => {
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: result.status === 'success' ? 'success' : 'failure',
            endedAt: new Date(),
            result: result,
          },
        });
      })
      .catch(async (error) => {
        await prisma.execution.update({
          where: { id: execution.id },
          data: {
            status: 'failure',
            endedAt: new Date(),
            error: error.message,
          },
        });
      });

    res.json({ executionId: execution.id, status: 'running', message: 'Workflow execution started' });
  } catch (error) {
    res.status(500).json({ error: 'Execution failed to start' });
  }
}
