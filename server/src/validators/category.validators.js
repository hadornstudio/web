import { body } from 'express-validator';

export const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type')
    .isIn(['necklaces', 'bracelets', 'earrings', 'anklets', 'custom'])
    .withMessage('Invalid category type'),
  body('description').optional().isLength({ max: 500 }),
];

export const updateCategoryValidator = [
  body('name').optional().trim().notEmpty(),
  body('type').optional().isIn(['necklaces', 'bracelets', 'earrings', 'anklets', 'custom']),
  body('description').optional().isLength({ max: 500 }),
];
