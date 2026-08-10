import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAdValidator, updateAdValidator } from '../validators/ad.validators.js';
import { listAdsPublic, listAdsAdmin, createAd, updateAd, deleteAd } from '../controllers/ad.controller.js';

const router = Router();

router.get('/', listAdsPublic);
router.get('/admin/all', protect, authorize('admin'), listAdsAdmin);
router.post('/', protect, authorize('admin'), createAdValidator, validate, createAd);
router.put('/:id', protect, authorize('admin'), updateAdValidator, validate, updateAd);
router.delete('/:id', protect, authorize('admin'), deleteAd);

export default router;
