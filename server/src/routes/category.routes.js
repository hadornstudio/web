import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCategoryValidator, updateCategoryValidator } from '../validators/category.validators.js';
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listAllCategoriesAdmin,
} from '../controllers/category.controller.js';

const router = Router();

router.get('/', listCategories);
router.get('/admin/all', protect, authorize('admin'), listAllCategoriesAdmin);
router.get('/:slug', getCategory);
router.post('/', protect, authorize('admin'), createCategoryValidator, validate, createCategory);
router.put('/:id', protect, authorize('admin'), updateCategoryValidator, validate, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
