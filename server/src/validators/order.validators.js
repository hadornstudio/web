import { body } from 'express-validator';

export const initializePaymentValidator = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.productId').isMongoId().withMessage('Each item needs a valid productId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
  body('shippingAddress.state').trim().notEmpty(),
  body('shippingAddress.country').trim().notEmpty(),
];

export const createOrderValidator = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.productId').isMongoId().withMessage('Each item needs a valid productId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
  body('reference').trim().notEmpty().withMessage('reference is required'),
  body('shippingAddress.fullName').trim().notEmpty(),
  body('shippingAddress.line1').trim().notEmpty(),
  body('shippingAddress.city').trim().notEmpty(),
  body('shippingAddress.state').trim().notEmpty(),
  body('shippingAddress.postalCode').trim().notEmpty(),
  body('shippingAddress.country').trim().notEmpty(),
];

export const updateOrderStatusValidator = [
  body('status')
    .isIn(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
];
