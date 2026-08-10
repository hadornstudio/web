import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { uploadSingle, uploadAdMedia } from '../middleware/upload.js';
import { uploadImage, uploadAdMediaFile } from '../controllers/upload.controller.js';

const router = Router();

router.post('/', protect, authorize('admin'), uploadSingle, uploadImage);

// Public (rate-limited, not admin-gated) — lets a customer attach reference images to a
// custom-order inquiry without needing an account. Same controller/Cloudinary folder as
// the admin upload; only the auth requirement differs.
router.post('/inquiry', authLimiter, uploadSingle, uploadImage);

router.post('/ad-media', protect, authorize('admin'), uploadAdMedia, uploadAdMediaFile);

export default router;
