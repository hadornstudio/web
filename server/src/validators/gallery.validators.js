import { body } from 'express-validator';

// Optional 3D model (see GalleryItem.model). An empty URL means "no model".
const modelRules = [
  body('model.url').optional({ checkFalsy: true }).isString().isLength({ max: 500 }),
  body('model.format').optional({ checkFalsy: true }).isIn(['splat', 'glb']),
  body('model.height').optional({ checkFalsy: true }).isFloat({ min: 0.1, max: 4 }),
  body('model.rotation').optional().isArray({ min: 3, max: 3 }),
  body('model.rotation.*').optional().isFloat({ min: -360, max: 360 }),
  body('model.offsetY').optional({ checkFalsy: true }).isFloat({ min: -2, max: 2 }),
];

export const createGalleryItemValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('description').optional().isLength({ max: 1000 }),
  // checkFalsy: true — an empty-string select value ("no product/category chosen") should
  // pass through as unset, not fail isMongoId() the way a bare `.optional()` would.
  body('product').optional({ checkFalsy: true }).isMongoId(),
  body('category').optional({ checkFalsy: true }).isMongoId(),
  ...modelRules,
];

export const updateGalleryItemValidator = [
  body('title').optional().trim().notEmpty(),
  body('images').optional().isArray({ min: 1 }),
  body('description').optional().isLength({ max: 1000 }),
  body('product').optional({ checkFalsy: true }).isMongoId(),
  body('category').optional({ checkFalsy: true }).isMongoId(),
  ...modelRules,
];
