import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCouponValidator, validateCouponValidator } from '../validators/coupon.validators.js';
import {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/coupon.controller.js';

const router = Router();

router.post('/validate', protect, validateCouponValidator, validate, validateCoupon);
router.get('/', protect, authorize('admin'), listCoupons);
router.post('/', protect, authorize('admin'), createCouponValidator, validate, createCoupon);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

export default router;
