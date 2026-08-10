import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getOverview } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/overview', protect, authorize('admin'), getOverview);

export default router;
