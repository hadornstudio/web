import { body } from 'express-validator';

const PLACEMENTS = ['homepage-banner', 'shop-banner', 'gallery-banner'];
const LINK_TYPES = ['promo', 'product', 'category', 'url', 'none'];

export const createAdValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('mediaType').isIn(['image', 'video']).withMessage('mediaType must be image or video'),
  body('mediaUrl').trim().notEmpty().withMessage('Media is required'),
  body('placement').isIn(PLACEMENTS).withMessage('Invalid placement'),
  body('linkType').optional().isIn(LINK_TYPES),
  body('promo').optional({ checkFalsy: true }).isMongoId(),
  body('product').optional({ checkFalsy: true }).isMongoId(),
  body('category').optional({ checkFalsy: true }).isMongoId(),
  body('url').optional({ checkFalsy: true }).isString(),
  body('startsAt').optional({ checkFalsy: true }).isISO8601(),
  body('endsAt').optional({ checkFalsy: true }).isISO8601(),
  body('sortOrder').optional().isInt(),
];

export const updateAdValidator = [
  body('title').optional().trim().notEmpty(),
  body('mediaType').optional().isIn(['image', 'video']),
  body('mediaUrl').optional().trim().notEmpty(),
  body('placement').optional().isIn(PLACEMENTS),
  body('linkType').optional().isIn(LINK_TYPES),
  body('promo').optional({ checkFalsy: true }).isMongoId(),
  body('product').optional({ checkFalsy: true }).isMongoId(),
  body('category').optional({ checkFalsy: true }).isMongoId(),
  body('url').optional({ checkFalsy: true }).isString(),
  body('startsAt').optional({ checkFalsy: true }).isISO8601(),
  body('endsAt').optional({ checkFalsy: true }).isISO8601(),
  body('sortOrder').optional().isInt(),
];
