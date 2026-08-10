import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPromoValidator, updatePromoValidator } from '../validators/promo.validators.js';
import {
  listPromosAdmin,
  createPromo,
  updatePromo,
  deletePromo,
  announcePromo,
} from '../controllers/promo.controller.js';

const router = Router();

router.get('/', protect, authorize('admin'), listPromosAdmin);
router.post('/', protect, authorize('admin'), createPromoValidator, validate, createPromo);
router.put('/:id', protect, authorize('admin'), updatePromoValidator, validate, updatePromo);
router.delete('/:id', protect, authorize('admin'), deletePromo);
router.post('/:id/announce', protect, authorize('admin'), announcePromo);

export default router;
