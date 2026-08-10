import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { initializePaymentValidator } from '../validators/order.validators.js';
import { initializePayment, webhookHandler } from '../controllers/payment.controller.js';

const router = Router();

router.post('/initialize', protect, initializePaymentValidator, validate, initializePayment);

export { webhookHandler };
export default router;
