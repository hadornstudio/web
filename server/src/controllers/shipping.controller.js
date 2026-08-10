import ShippingRate from '../models/ShippingRate.js';
import ShippingSettings from '../models/ShippingSettings.js';
import Product from '../models/Product.js';
import { NIGERIAN_STATES } from '../constants/nigerianStates.js';
import { resolveShippingCost } from '../utils/resolveShippingCost.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Self-healing: any state from the canonical list that doesn't have a rate document yet
// gets created (unpriced) rather than requiring a one-time seed script run.
async function ensureAllStatesExist() {
  const existing = await ShippingRate.find().select('state');
  const existingNames = new Set(existing.map((r) => r.state));
  const missing = NIGERIAN_STATES.filter((s) => !existingNames.has(s));
  if (missing.length) {
    await ShippingRate.insertMany(missing.map((state) => ({ state })));
  }
}

export const listLocalRatesAdmin = asyncHandler(async (req, res) => {
  await ensureAllStatesExist();
  const rates = await ShippingRate.find().sort({ state: 1 });
  res.json({ success: true, data: { rates } });
});

export const updateLocalRates = asyncHandler(async (req, res) => {
  const { rates } = req.body;
  await Promise.all(
    rates.map(({ state, price, isActive }) =>
      ShippingRate.findOneAndUpdate(
        { state },
        { $set: { ...(price !== undefined ? { price } : {}), ...(isActive !== undefined ? { isActive } : {}) } },
        { upsert: true }
      )
    )
  );
  const updated = await ShippingRate.find().sort({ state: 1 });
  res.json({ success: true, data: { rates: updated } });
});

export const listLocalRatesPublic = asyncHandler(async (req, res) => {
  const rates = await ShippingRate.find({ isActive: true, price: { $ne: null } })
    .select('state price')
    .sort({ state: 1 });
  res.json({ success: true, data: { rates } });
});

export const getShippingSettingsAdmin = asyncHandler(async (req, res) => {
  const settings = await ShippingSettings.getSingleton();
  res.json({ success: true, data: { settings } });
});

export const updateShippingSettings = asyncHandler(async (req, res) => {
  const settings = await ShippingSettings.getSingleton();
  const fields = ['defaultLocalRate', 'internationalFlatRate', 'originLine1', 'originCity', 'originState', 'originPhone'];
  for (const field of fields) {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  }
  await settings.save();
  res.json({ success: true, data: { settings } });
});

export const getShippingQuote = asyncHandler(async (req, res) => {
  const { state, country, subtotal, items: cartItems = [] } = req.body;

  let items = [];
  if (cartItems.length) {
    const products = await Product.find({ _id: { $in: cartItems.map((i) => i.productId) } }).select('title basePrice weight');
    const productById = new Map(products.map((p) => [String(p._id), p]));
    items = cartItems
      .map((i) => {
        const product = productById.get(i.productId);
        if (!product) return null;
        return { title: product.title, unitPrice: product.basePrice, quantity: i.quantity, weight: product.weight };
      })
      .filter(Boolean);
  }

  const result = await resolveShippingCost({ subtotal, items, shippingAddress: { state, country } });
  res.json({ success: true, data: result });
});
