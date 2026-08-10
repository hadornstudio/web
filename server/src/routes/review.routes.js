import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReviewValidator, updateReviewValidator } from '../validators/review.validators.js';
import {
  listProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';

const router = Router();

router.get('/product/:productId', listProductReviews);
router.post('/product/:productId', protect, createReviewValidator, validate, createReview);
router.put('/:id', protect, updateReviewValidator, validate, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
