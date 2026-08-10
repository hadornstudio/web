import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { createInquiryValidator, listInquiriesValidator, updateInquiryStatusValidator } from '../validators/inquiry.validators.js';
import { createInquiry, listInquiries, updateInquiryStatus } from '../controllers/inquiry.controller.js';

const router = Router();

router.post('/', authLimiter, createInquiryValidator, validate, createInquiry);
router.get('/', protect, authorize('admin'), listInquiriesValidator, validate, listInquiries);
router.patch('/:id/status', protect, authorize('admin'), updateInquiryStatusValidator, validate, updateInquiryStatus);

export default router;
