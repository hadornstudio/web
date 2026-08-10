import { body, query } from 'express-validator';

export const listInquiriesValidator = [
  query('status').optional({ checkFalsy: true }).isIn(['new', 'contacted', 'closed']),
];

export const updateInquiryStatusValidator = [
  body('status').isIn(['new', 'contacted', 'closed']).withMessage('Invalid status'),
];

export const createInquiryValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('description').trim().notEmpty().withMessage('Please describe what you have in mind').isLength({ max: 2000 }),
  body('phone').optional().trim(),
  body('budgetRange').optional().trim(),
  body('referenceImages').optional().isArray(),
];
