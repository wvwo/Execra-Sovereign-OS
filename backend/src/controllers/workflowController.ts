import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { analyzeVideo } from '../services/vision';
import { validateWorkflow } from '../validators/workflowValidator';
import { prisma } from '../utils/prismaClient';
import type { AuthRequest } from '../middleware/auth';

// Magic-byte signatures for allowed video formats
async function detectVideoMime(filePath: string): Promise<string | null> {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);

  // MP4 / MOV: bytes 4-7 == ftyp
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = buf.slice(8, 12).toString('ascii');
    return brand.startsWith('qt') ? 'video/quicktime' : 'video/mp4';
  }
  // WebM: starts with 0x1A 0x45 0xDF 0xA3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return 'video/webm';
  }
  return null;
}

export async function uploadVideo(req: AuthRequest, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    const sessionId = uuidv4();
    const videoPath = req.file.path;

    // Phase 6: Magic-bytes validation — reject spoofed MIME types
    const magicMime = await detectVideoMime(videoPath);
    if (!magicMime) {
      fs.unlinkSync(videoPath);
      return res.status(400).json({ error: 'File content does not match a valid video format (MP4, WebM, or MOV)' });
    }

    let workflowData;
    try {
      workflowData = await analyzeVideo(videoPath, sessionId);
    } finally {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    }

    const validation = validateWorkflow(workflowData);

    const workflow = await prisma.workflow.create({
      data: {
        userId: req.user!.id,
        title: workflowData.workflow_title,
        startUrl: workflowData.start_url,
        sessionId: workflowData.session_id,
        steps: workflowData.steps,
        metadata: workflowData.metadata,
        status: validation.isValid ? 'draft' : 'failed',
      },
    });

    res.status(201).json({
      workflow,
      validation: {
        isValid: validation.isValid,
        riskLevel: validation.riskLevel,
        violations: validation.violations,
        mitigations: validation.mitigations,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Video processing failed' });
  }
}

export async function updateWorkflow(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { steps, title } = req.body;

    // IDOR: verify ownership before mutating
    const existing = await prisma.workflow.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) return res.status(404).json({ error: 'Workflow not found' });

    const validation = validateWorkflow({ ...req.body, steps });

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        steps,
        title,
        status: validation.isValid ? 'active' : 'draft',
      },
    });

    res.json({ workflow, validation });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
}

export async function listWorkflows(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.workflow.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({ workflows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('List workflows error:', error);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
}
