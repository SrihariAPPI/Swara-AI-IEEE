import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/index.js';
import type { AnalyticsSummary, VerdictLabel } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/summary', async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  const snapshot = await db.collection('verification_history')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(1000)
    .get();

  const docs = snapshot.docs.map(d => d.data() as any);

  const summary: AnalyticsSummary = {
    totalVerifications: docs.length,
    verdictDistribution: { TRUE: 0, FALSE: 0, MISLEADING: 0, PARTIALLY_TRUE: 0, INSUFFICIENT_EVIDENCE: 0 },
    averageConfidence: 0,
    datasetUsage: {},
    averageLatencyMs: 0,
    mostCommonDomain: 'unknown',
  };

  const domainCounts: Record<string, number> = {};

  for (const doc of docs) {
    const label = doc.verdict?.label as VerdictLabel;
    if (label && label in summary.verdictDistribution) {
      summary.verdictDistribution[label]++;
    }
    summary.averageConfidence += doc.verdict?.confidence || 0;
    summary.averageLatencyMs += doc.metrics?.latencyMs || 0;

    for (const ev of doc.evidenceUsed || []) {
      const ds = ev.datasetId || ev.datasetName || 'unknown';
      summary.datasetUsage[ds] = (summary.datasetUsage[ds] || 0) + 1;
    }

    for (const claim of doc.claims || []) {
      const domain = claim.domain || 'unknown';
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }
  }

  if (docs.length > 0) {
    summary.averageConfidence = Math.round(summary.averageConfidence / docs.length);
    summary.averageLatencyMs = Math.round(summary.averageLatencyMs / docs.length);
  }

  let maxCount = 0;
  for (const [domain, count] of Object.entries(domainCounts)) {
    if (count > maxCount) {
      maxCount = count;
      summary.mostCommonDomain = domain;
    }
  }

  res.json(summary);
});

router.get('/confidence-distribution', async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  const snapshot = await db.collection('verification_history')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(500)
    .get();

  const buckets = [
    { range: '0-20%', min: 0, max: 20, count: 0 },
    { range: '21-40%', min: 21, max: 40, count: 0 },
    { range: '41-60%', min: 41, max: 60, count: 0 },
    { range: '61-80%', min: 61, max: 80, count: 0 },
    { range: '81-100%', min: 81, max: 100, count: 0 },
  ];

  for (const doc of snapshot.docs) {
    const conf = doc.data()?.verdict?.confidence ?? 0;
    for (const bucket of buckets) {
      if (conf >= bucket.min && conf <= bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  res.json({ buckets });
});

export default router;
