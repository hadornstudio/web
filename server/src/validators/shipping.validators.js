import { body } from 'express-validator';
import { NIGERIAN_STATES } from '../constants/nigerianStates.js';

export const updateLocalRatesValidator = [
  body('rates').isArray({ min: 1 }).withMessage('rates must be a non-empty array'),
  body('rates.*.state').isIn(NIGERIAN_STATES).withMessage('Unknown state'),
  body('rates.*.price').optional({ nullable: true }).isFloat({ min: 0 }),
  body('rates.*.isActive').optional().isBoolean(),
];

export const updateShippingSettingsValidator = [
  body('defaultLocalRate').optional({ nullable: true }).isFloat({ min: 0 }),
  body('internationalFlatRate').optional({ nullable: true }).isFloat({ min: 0 }),
  body('originLine1').optional().isString().trim(),
  body('originCity').optional().isString().trim(),
  body('originState').optional().isString().trim(),
  body('originPhone').optional().isString().trim(),
];

export const shippingQuoteValidator = [
  body('state').optional().isString().trim(),
  body('country').isString().trim().notEmpty().withMessage('country is required'),
  body('subtotal').isFloat({ min: 0 }),
];
