import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { analyzeVideo } from '../services/vision';
import { validateWorkflow } from '../validators/workflowValidator';
import { prisma } from '../utils/prismaClient';
const UPLOAD_DIR = '/tmp/uploads';

export async function uploadVideo(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    const sessionId = uuidv4();
    const videoPath = req.file.path;
    
    // Validate video format and MIME type
    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!['.mp4', '.webm', '.mov'].includes(ext) || !allowedMimes.includes(req.file.mimetype)) {
      fs.unlinkSync(videoPath);
      return res.status(400).json({ error: 'Invalid format or MIME type. Use MP4, WebM, or MOV' });
    }

    // Send to Vision Engine
    let workflowData;
    try {
      workflowData = await analyzeVideo(videoPath, sessionId);
    } finally {
      // Delete video immediately (privacy) - ensuring it runs even if vision fails
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    // Validate generated workflow (ISO 9001 Gates)
    const validation = validateWorkflow(workflowData);
    
    // Save to DB
    const workflow = await prisma.workflow.create({
      data: {
        userId: (req.user as any).id,
        title: workflowData.workflow_title,
        startUrl: workflowData.start_url,
        sessionId: workflowData.session_id,
        steps: workflowData.steps,
        metadata: workflowData.metadata,
        status: validation.isValid ? 'draft' : 'failed'
      }
    });

    res.status(201).json({
      workflow,
      validation: {
        isValid: validation.isValid,
        riskLevel: validation.riskLevel,
        violations: validation.violations,
        mitigations: validation.mitigations
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Video processing failed' });
  }
}

export async function updateWorkflow(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { steps, title } = req.body;

    const validation = validateWorkflow({ ...req.body, steps });
    
    const workflow = await prisma.workflow.update({
      where: { id, userId: (req.user as any).id },
      data: {
        steps,
        title,
        status: validation.isValid ? 'active' : 'draft'
      }
    });

    res.json({ workflow, validation });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
}

export async function listWorkflows(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where: { userId: (req.user as any).id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.workflow.count({ where: { userId: (req.user as any).id } })
    ]);

    res.json({ workflows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('List workflows error:', error);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
}
