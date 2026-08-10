import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetPasswordValidator = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];
