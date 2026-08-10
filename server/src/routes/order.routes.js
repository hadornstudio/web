import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderValidator, updateOrderStatusValidator } from '../validators/order.validators.js';
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  listOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatus,
} from '../controllers/order.controller.js';

const router = Router();

router.post('/', protect, createOrderValidator, validate, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/mine/:id', protect, getMyOrderById);

router.get('/', protect, authorize('admin'), listOrdersAdmin);
router.get('/:id', protect, authorize('admin'), getOrderByIdAdmin);
router.patch('/:id/status', protect, authorize('admin'), updateOrderStatusValidator, validate, updateOrderStatus);

export default router;
