import { body, query } from 'express-validator';

// Public catalog listing builds its Mongoose filter straight from these query params —
// mongo-sanitize (app.js) already strips operator-injection payloads globally, but this
// pins each field to the plain string type the controller actually expects.
// checkFalsy: true so the catalog page's empty-string filter defaults (e.g. minPrice=&availability=)
// are treated as "not provided" instead of failing isFloat/isIn on ''.
export const listProductsValidator = [
  query('category').optional({ checkFalsy: true }).isString().trim(),
  query('minPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  query('maxPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  query('material').optional({ checkFalsy: true }).isString().trim(),
  query('color').optional({ checkFalsy: true }).isString().trim(),
  query('availability').optional({ checkFalsy: true }).isIn(['in_stock', 'low_stock', 'out_of_stock', 'made_to_order']),
  query('search').optional({ checkFalsy: true }).isString().trim(),
  query('sort').optional({ checkFalsy: true }).isIn(['newest', 'price_asc', 'price_desc', 'rating', 'featured']),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 60 }),
];

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
