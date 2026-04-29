import { prisma } from '../utils/prismaClient';
import { enqueueExecution } from './queue';
import { v4 as uuidv4 } from 'uuid';

export async function evaluateTrigger(triggerId: string, payload: unknown): Promise<void> {
  const trigger = await prisma.trigger.findUnique({
    where: { id: triggerId },
    include: { workflow: true },
  });

  if (!trigger || !trigger.isActive) return;

  // Create an execution for the triggered workflow
  const executionId = uuidv4();
  await prisma.execution.create({
    data: {
      id: executionId,
      workflowId: trigger.workflowId,
      status: 'queued',
      stepsTotal: Array.isArray((trigger.workflow.steps as unknown[]) ) ? (trigger.workflow.steps as unknown[]).length : 0,
    },
  });

  // Update trigger fire stats
  await prisma.trigger.update({
    where: { id: triggerId },
    data: { lastFired: new Date(), fireCount: { increment: 1 } },
  });

  // Push to execution queue
  await enqueueExecution(trigger.workflowId, executionId, (payload as Record<string, unknown>) ?? {});
}

export async function createTrigger(
  workflowId: string,
  type: string,
  config: Record<string, unknown>
) {
  return prisma.trigger.create({
    data: {
      workflowId,
      type: type as Parameters<typeof prisma.trigger.create>[0]['data']['type'],
      config: config as Parameters<typeof prisma.trigger.create>[0]['data']['config'],
    },
  });
}
