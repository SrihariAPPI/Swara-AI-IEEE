import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, verificationLimiter, AppError } from '../middleware/index.js';
import type { VerificationInput, VerificationResult, ProgressStep, VerdictLabel } from '../types/index.js';

const router = Router();
router.use(authMiddleware);
router.use(verificationLimiter);

const activeJobs = new Map<string, { result: VerificationResult | null; progress: ProgressStep[] }>();

router.post('/', async (req: Request, res: Response) => {
  const input = req.body as VerificationInput;
  const userId = req.userId!;

  if (!input || !input.type || !input.content) {
    throw new AppError(400, 'Missing required fields: type, content');
  }

  if (!['text', 'url', 'pdf', 'image'].includes(input.type)) {
    throw new AppError(400, 'Invalid input type. Must be: text, url, pdf, or image');
  }

  if (input.content.length > 50000) {
    throw new AppError(400, 'Content exceeds maximum length of 50,000 characters');
  }

  const jobId = uuidv4();
  const progress: ProgressStep[] = [];
  activeJobs.set(jobId, { result: null, progress });

  const startTime = Date.now();

  res.status(202).json({ jobId, status: 'processing' });

  try {
    const { runVerificationPipeline } = await import('../services/verificationEngine.js');
    const result = await runVerificationPipeline(input, userId, (step) => {
      progress.push(step);
    });

    result.id = jobId;
    result.userId = userId;
    result.createdAt = new Date().toISOString();
    result.metrics = {
      latencyMs: Date.now() - startTime,
      datasetsSearched: result.evidenceUsed?.length || 0,
      evidenceCount: result.evidenceUsed?.length || 0,
    };

    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();
    await db.collection('verification_history').doc(jobId).set({
      userId,
      input: result.input,
      claims: result.claims,
      verdict: result.verdict,
      evidenceUsed: result.evidenceUsed,
      reasoning: result.reasoning,
      citations: result.citations,
      metrics: result.metrics,
      createdAt: result.createdAt,
    });

    activeJobs.set(jobId, { result, progress });
  } catch (err: any) {
    progress.push({
      agent: 'verification',
      status: 'error',
      message: err.message || 'Verification failed',
      progress: 1,
    });
    const failedResult: VerificationResult = {
      id: jobId,
      userId,
      input,
      claims: [],
      verdict: { label: 'INSUFFICIENT_EVIDENCE', confidence: 0 },
      evidenceUsed: [],
      reasoning: { steps: [], crossVerification: '', alternativeInterpretation: err.message },
      citations: [],
      metrics: { latencyMs: Date.now() - startTime, datasetsSearched: 0, evidenceCount: 0 },
      createdAt: new Date().toISOString(),
    };
    activeJobs.set(jobId, { result: failedResult, progress });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const job = activeJobs.get(req.params.id);
  if (!job) {
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();
    const doc = await db.collection('verification_history').doc(req.params.id).get();
    if (!doc.exists) {
      throw new AppError(404, 'Verification job not found');
    }
    res.json({ id: doc.id, ...doc.data(), status: 'complete' });
    return;
  }

  if (job.result) {
    res.json({ ...job.result, status: 'complete', progress: job.progress });
  } else {
    res.json({ jobId: req.params.id, status: 'processing', progress: job.progress });
  }
});

router.get('/:id/stream', async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const job = activeJobs.get(jobId);
  if (!job) {
    throw new AppError(404, 'Verification job not found');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const maxWait = 60000;
  const start = Date.now();
  const pollInterval = setInterval(() => {
    const current = activeJobs.get(jobId);
    if (!current) {
      res.write(`event: error\ndata: {"message":"Job not found"}\n\n`);
      res.end();
      clearInterval(pollInterval);
      return;
    }

    if (current.result) {
      res.write(`event: complete\ndata: ${JSON.stringify(current.result)}\n\n`);
      res.end();
      clearInterval(pollInterval);
      return;
    }

    if (current.progress.length > 0) {
      res.write(`event: progress\ndata: ${JSON.stringify(current.progress[current.progress.length - 1])}\n\n`);
    }

    if (Date.now() - start > maxWait) {
      res.write(`event: timeout\ndata: {"message":"Verification timed out"}\n\n`);
      res.end();
      clearInterval(pollInterval);
    }
  }, 500);

  req.on('close', () => {
    clearInterval(pollInterval);
  });
});

export default router;
