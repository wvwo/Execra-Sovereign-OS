import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Build Redis connection — prefer REDIS_URL (Railway injects this), fall back to individual vars
function buildRedisConnection(): Redis | null {
  try {
    const redisUrl = process.env.REDIS_URL;
    let connection: Redis;

    if (redisUrl) {
      connection = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    } else if (process.env.REDIS_HOST) {
      connection = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    } else {
      console.warn('[Queue] No Redis config found — queue disabled');
      return null;
    }

    connection.on('error', (err) => {
      console.warn('[Queue] Redis connection error (non-fatal):', err.message);
    });

    return connection;
  } catch (err) {
    console.warn('[Queue] Failed to init Redis connection:', (err as Error).message);
    return null;
  }
}

const connection = buildRedisConnection();

// Queue is optional — if Redis unavailable, enqueue is a no-op
export const executionQueue = connection
  ? new Queue('workflow-execution', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    })
  : null;

export const triggerQueue = connection
  ? new Queue('trigger-evaluation', {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: { count: 50 },
      },
    })
  : null;

// Workers only if Redis is available
if (connection) {
  const executionWorker = new Worker(
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

  const triggerWorker = new Worker(
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
}

export async function enqueueExecution(
  workflowId: string,
  executionId: string,
  variables: Record<string, unknown> = {}
): Promise<void> {
  if (!executionQueue) {
    console.warn('[Queue] Queue not available — running execution inline');
    return;
  }
  await executionQueue.add('execute', { workflowId, executionId, variables }, { jobId: executionId });
}
