import { body } from 'express-validator';

export const createPromoValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isLength({ max: 1000 }),
  body('bannerImage').optional().isString(),
  body('coupon').optional({ checkFalsy: true }).isMongoId(),
  body('startsAt').optional({ checkFalsy: true }).isISO8601(),
  body('endsAt').optional({ checkFalsy: true }).isISO8601(),
];

export const updatePromoValidator = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().isLength({ max: 1000 }),
  body('bannerImage').optional().isString(),
  body('coupon').optional({ checkFalsy: true }).isMongoId(),
  body('startsAt').optional({ checkFalsy: true }).isISO8601(),
  body('endsAt').optional({ checkFalsy: true }).isISO8601(),
];
