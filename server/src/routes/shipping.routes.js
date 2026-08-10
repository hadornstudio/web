import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateLocalRatesValidator,
  updateShippingSettingsValidator,
  shippingQuoteValidator,
} from '../validators/shipping.validators.js';
import {
  listLocalRatesAdmin,
  updateLocalRates,
  listLocalRatesPublic,
  getShippingSettingsAdmin,
  updateShippingSettings,
  getShippingQuote,
} from '../controllers/shipping.controller.js';

const router = Router();

router.get('/local', listLocalRatesPublic);
router.post('/quote', shippingQuoteValidator, validate, getShippingQuote);

router.get('/local/admin', protect, authorize('admin'), listLocalRatesAdmin);
router.put('/local', protect, authorize('admin'), updateLocalRatesValidator, validate, updateLocalRates);
router.get('/settings', protect, authorize('admin'), getShippingSettingsAdmin);
router.put('/settings', protect, authorize('admin'), updateShippingSettingsValidator, validate, updateShippingSettings);

export default router;
