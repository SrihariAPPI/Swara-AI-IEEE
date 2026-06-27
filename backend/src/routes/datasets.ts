import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: Request, res: Response) => {
  const { getDatasetRegistry } = await import('../datasets/loader.js');
  const datasets = getDatasetRegistry().map(d => ({
    id: d.id,
    name: d.name,
    version: d.version,
    recordCount: d.recordCount,
    loaded: d.loaded,
    fields: d.fields,
  }));
  res.json({ datasets });
});

router.get('/:id/stats', async (req: Request, res: Response) => {
  const { getDatasetStats } = await import('../datasets/loader.js');
  const stats = await getDatasetStats(req.params.id);
  if (!stats) {
    res.status(404).json({ error: 'Dataset not found' });
    return;
  }
  res.json(stats);
});

export default router;
