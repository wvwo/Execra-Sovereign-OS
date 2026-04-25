import { Router } from 'express';
import multer from 'multer';
import { uploadVideo, updateWorkflow, listWorkflows } from '../controllers/workflowController';
import { authenticate } from '../middleware/auth';

const upload = multer({
  dest: '/tmp/uploads',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const router = Router();

router.post('/upload', authenticate, upload.single('video'), uploadVideo);
router.get('/', authenticate, listWorkflows);
router.put('/:id', authenticate, updateWorkflow);

export default router;
