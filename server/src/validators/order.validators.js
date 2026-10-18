import { body } from 'express-validator';


// Configurator selections: { options: { partId: optionId }, addons: [addonId] } — the server
// re-validates and re-prices these against the product; these checks just bound the shape.
const itemConfigValidators = [
  body('items.*.options').optional().isObject(),
  body('items.*.options.*').optional().isString().isLength({ max: 40 }),
  body('items.*.addons').optional().isArray({ max: 10 }),
  body('items.*.addons.*').isString().isLength({ max: 40 }),
];

export const initializePaymentValidator = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.productId').isMongoId().withMessage('Each item needs a valid productId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
  body('shippingAddress.state').trim().notEmpty(),
  body('shippingAddress.country').trim().notEmpty(),
  ...itemConfigValidators,
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
  ...itemConfigValidators,
];

export const updateOrderStatusValidator = [
  body('status')
    .isIn(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
];
