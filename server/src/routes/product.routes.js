import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listProductsValidator,
  createProductValidator,
  updateProductValidator,
  adjustStockValidator,
} from '../validators/product.validators.js';
import {
  listProducts,
  listFeaturedProducts,
  getProduct,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  listAllProductsAdmin,
} from '../controllers/product.controller.js';

const router = Router();

router.get('/', listProductsValidator, validate, listProducts);
router.get('/featured', listFeaturedProducts);
router.get('/admin/all', protect, authorize('admin'), listAllProductsAdmin);
router.get('/:slug', getProduct);
router.get('/:id/related', getRelatedProducts);
router.post('/', protect, authorize('admin'), createProductValidator, validate, createProduct);
router.put('/:id', protect, authorize('admin'), updateProductValidator, validate, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.patch('/:id/stock', protect, authorize('admin'), adjustStockValidator, validate, adjustStock);

export default router;
