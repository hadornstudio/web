import { body } from 'express-validator';

export const createProductValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isMongoId().withMessage('A valid category id is required'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('basePrice must be a non-negative number'),
  body('variants').optional().isArray(),
];

export const updateProductValidator = [
  body('title').optional().trim().notEmpty(),
  body('category').optional().isMongoId(),
  body('images').optional().isArray({ min: 1 }),
  body('basePrice').optional().isFloat({ min: 0 }),
  body('variants').optional().isArray(),
];

export const adjustStockValidator = [
  body('stock').optional().isInt({ min: 0 }),
  body('variantId').optional().isMongoId(),
  body('variantStock').optional().isInt({ min: 0 }),
];
