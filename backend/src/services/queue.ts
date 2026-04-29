import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

connection.on('error', (err) => {
  // Log but don't crash — queue is optional
  console.error('[Queue] Redis connection error:', err.message);
});

export const executionQueue = new Queue('workflow-execution', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const triggerQueue = new Queue('trigger-evaluation', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 50 },
  },
});

// Execution worker — concurrency 5
export const executionWorker = new Worker(
  'workflow-execution',
  async (job) => {
    const { workflowId, executionId, variables } = job.data as {
      workflowId: string;
      executionId: string;
      variables: Record<string, unknown>;
    };
    const { executeWorkflow } = await import('./execution');
    return executeWorkflow({ workflowId, executionId, variables } as Parameters<typeof executeWorkflow>[0]);
  },
  { connection, concurrency: 5 }
);

// Trigger evaluation worker — concurrency 10
export const triggerWorker = new Worker(
  'trigger-evaluation',
  async (job) => {
    const { triggerId, payload } = job.data as { triggerId: string; payload: unknown };
    const { evaluateTrigger } = await import('./triggerEngine');
    return evaluateTrigger(triggerId, payload);
  },
  { connection, concurrency: 10 }
);

executionWorker.on('failed', (job, err) => {
  console.error(`[Queue] Execution job ${job?.id} failed:`, err.message);
});

triggerWorker.on('failed', (job, err) => {
  console.error(`[Queue] Trigger job ${job?.id} failed:`, err.message);
});

export const executionQueueEvents = new QueueEvents('workflow-execution', { connection });

export async function enqueueExecution(
  workflowId: string,
  executionId: string,
  variables: Record<string, unknown> = {}
) {
  return executionQueue.add(
    'execute',
    { workflowId, executionId, variables },
    { jobId: executionId }
  );
}
