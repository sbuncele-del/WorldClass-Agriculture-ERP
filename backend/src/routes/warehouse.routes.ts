import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all warehouse routes
router.use(tenantMiddleware);

router.get('/', (_req, res) => {
  res.json({ message: 'Get all', data: [] });
});

export default router;
