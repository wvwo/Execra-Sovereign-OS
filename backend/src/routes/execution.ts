import { Router } from 'express';
import { runWorkflow } from '../controllers/executionController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.post('/:id/run', authenticate, runWorkflow);

export default router;
