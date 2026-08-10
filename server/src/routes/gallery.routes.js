import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createGalleryItemValidator, updateGalleryItemValidator } from '../validators/gallery.validators.js';
import {
  listGalleryItems,
  getMyLikedGalleryItemIds,
  toggleLike,
  listAllGalleryItemsAdmin,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  listLikesAdmin,
} from '../controllers/gallery.controller.js';

const router = Router();

router.get('/', listGalleryItems);
router.get('/mine/liked', protect, getMyLikedGalleryItemIds);
router.post('/:id/like', protect, toggleLike);

router.get('/admin/all', protect, authorize('admin'), listAllGalleryItemsAdmin);
router.get('/admin/likes', protect, authorize('admin'), listLikesAdmin);
router.post('/', protect, authorize('admin'), createGalleryItemValidator, validate, createGalleryItem);
router.put('/:id', protect, authorize('admin'), updateGalleryItemValidator, validate, updateGalleryItem);
router.delete('/:id', protect, authorize('admin'), deleteGalleryItem);

export default router;
