import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/index.js';

const router = Router();
router.use(authMiddleware);

const getHistoryCollection = () => {
  const { getFirestore } = await_import_firestore();
  return getFirestore().collection('verification_history');
};

router.get('/', async (req: Request, res: Response) => {
  const userId = req.userId!;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const startAfter = req.query.startAfter as string | undefined;

  let query = getHistoryCollection()
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (startAfter) {
    const startDoc = await getHistoryCollection().doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  const items = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

  res.json({
    items,
    hasMore: items.length === limit,
    lastId: items.length > 0 ? items[items.length - 1].id : null,
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  const doc = await getHistoryCollection().doc(req.params.id).get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Verification not found' });
    return;
  }
  const data = doc.data();
  if (data?.userId !== req.userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  res.json({ id: doc.id, ...data });
});

function await_import_firestore() {
  const { getFirestore } = require('firebase-admin/firestore');
  return { getFirestore };
}

export default router;
