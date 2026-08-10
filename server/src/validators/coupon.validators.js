import { body } from 'express-validator';

export const createCouponValidator = [
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('type').isIn(['flat', 'percent']).withMessage('type must be flat or percent'),
  body('value').isFloat({ min: 0 }).withMessage('value must be a non-negative number'),
  body('conditions.minQuantity').optional({ checkFalsy: true }).isInt({ min: 1 }),
  body('conditions.minQuantityCategory').optional({ checkFalsy: true }).isMongoId(),
];

export const updateCouponValidator = [
  body('code').optional().trim().notEmpty(),
  body('type').optional().isIn(['flat', 'percent']),
  body('value').optional().isFloat({ min: 0 }),
  body('minOrderValue').optional().isFloat({ min: 0 }),
  body('maxDiscountAmount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('usageLimit').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('perUserLimit').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean(),
  body('conditions.minQuantity').optional({ checkFalsy: true }).isInt({ min: 1 }),
  body('conditions.minQuantityCategory').optional({ checkFalsy: true }).isMongoId(),
];

export const validateCouponValidator = [
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('subtotal must be a non-negative number'),
  body('items').optional().isArray(),
  body('items.*.productId').optional().isMongoId(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
];
