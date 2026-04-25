import { Request, Response } from 'express';
import { executeWorkflow } from '../services/execution';
import { validateWorkflow } from '../validators/workflowValidator';
import { prisma } from '../utils/prismaClient';

export async function runWorkflow(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: (req.user as any).id }
    });

    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    // Re-validate before execution
    const validation = validateWorkflow({
      workflow_title: workflow.title,
      start_url: workflow.startUrl,
      session_id: workflow.sessionId,
      steps: workflow.steps
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Workflow validation failed',
        validation
      });
    }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        startedAt: new Date()
      }
    });

    // Execute asynchronously (don't await)
    executeWorkflow({
      workflow_title: workflow.title,
      start_url: workflow.startUrl,
      session_id: workflow.sessionId,
      workflow_id: workflow.id,
      steps: workflow.steps
    }).then(async (result) => {
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: result.status === 'success' ? 'success' : 'failure',
          completedAt: new Date(),
          result: result
        }
      });
    }).catch(async (error) => {
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'failure',
          completedAt: new Date(),
          errorLog: { message: error.message }
        }
      });
    });

    res.json({
      executionId: execution.id,
      status: 'running',
      message: 'Workflow execution started'
    });

  } catch (error) {
    res.status(500).json({ error: 'Execution failed to start' });
  }
}
