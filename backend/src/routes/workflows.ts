import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { uploadVideo, updateWorkflow, listWorkflows } from '../controllers/workflowController';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

// Store uploads with a UUID filename to prevent path traversal / filename injection
const storage = multer.diskStorage({
  destination: '/tmp/uploads',
  filename: (_req, _file, cb) => cb(null, `${uuidv4()}.tmp`),
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    // MIME allow-list check (first layer — attacker can spoof this)
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid MIME type. Upload MP4, WebM, or MOV only.'));
    }
    cb(null, true);
  },
});

const router = Router();

// uploadLimiter: 10 uploads/hr per IP
router.post('/upload', authenticate, uploadLimiter, upload.single('video'), uploadVideo);
router.get('/', authenticate, listWorkflows);
router.put('/:id', authenticate, updateWorkflow);

export default router;
