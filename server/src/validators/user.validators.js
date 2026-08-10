import { body } from 'express-validator';

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 80 }),
  body('phone').optional().trim(),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export const updatePreferencesValidator = [
  body('categories').optional().isArray().withMessage('categories must be an array'),
  body('categories.*').optional().isMongoId(),
  body('onboarded').optional().isBoolean(),
];

export const addressValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('country').optional().trim(),
  body('label').optional().trim(),
  body('line2').optional().trim(),
  body('phone').optional().trim(),
  body('isDefault').optional().isBoolean(),
];

export const updateUserRoleValidator = [
  body('role').isIn(['customer', 'admin']).withMessage('role must be customer or admin'),
];

export const updateUserStatusValidator = [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];
