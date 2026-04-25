import { PrismaClient, Prisma } from '@prisma/client';
import axios from 'axios';

const SENTINEL_URL = process.env.SENTINEL_URL || 'http://sentinel:8001';

// Base Prisma Client
const basePrisma = new PrismaClient();

// Audit Extension
export const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      // 1. Define sensitive models and operations
      const sensitiveModels = ['User', 'Workflow', 'Execution', 'ApiKey'];
      const sensitiveOperations = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'];
      
      // 2. Intercept and log if matches criteria
      if (model && sensitiveModels.includes(model) && sensitiveOperations.includes(operation)) {
        setImmediate(() => {
          axios.post(`${SENTINEL_URL}/api/v1/audit/log`, {
            session_id: 'system_db_audit',
            workflow_id: `db_${operation}_${model}`,
            event_type: 'DATABASE_MUTATION',
            status: 'success',
            severity: 'info',
            user_id: 'system', // Ideally extracted from context/AsyncLocalStorage
            details: {
              model,
              operation,
              timestamp: new Date().toISOString(),
              recordId: (args as any).where?.id || 'bulk_or_new',
            }
          }).catch(err => {
            console.error('[Audit Middleware] Failed to send log to Sentinel:', err.message);
          });
        });
      }
      
      // 3. Execute original query
      return query(args);
    },
  },
}) as unknown as PrismaClient; // Cast to retain standard client types for compatibility
