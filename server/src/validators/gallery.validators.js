import { body } from 'express-validator';

export const createGalleryItemValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('description').optional().isLength({ max: 1000 }),
  // checkFalsy: true — an empty-string select value ("no product/category chosen") should
  // pass through as unset, not fail isMongoId() the way a bare `.optional()` would.
  body('product').optional({ checkFalsy: true }).isMongoId(),
  body('category').optional({ checkFalsy: true }).isMongoId(),
];

export const updateGalleryItemValidator = [
  body('title').optional().trim().notEmpty(),
  body('images').optional().isArray({ min: 1 }),
  body('description').optional().isLength({ max: 1000 }),
  body('product').optional({ checkFalsy: true }).isMongoId(),
  body('category').optional({ checkFalsy: true }).isMongoId(),
];
