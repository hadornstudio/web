import ShippingRate from '../models/ShippingRate.js';
import ShippingSettings from '../models/ShippingSettings.js';
import { isNigeria } from '../constants/countries.js';
import { getInternationalShippingQuote } from './getInternationalShippingQuote.js';

const FREE_SHIPPING_THRESHOLD = 150000;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The one place shipping cost gets decided — used both for the checkout-preview quote
// endpoint and (again, authoritatively) at order-creation time. Never trusts a
// client-supplied shipping figure for anything that touches payment.
// `shippingAddress` is the full address shape (fullName, line1, line2, city, state,
// postalCode, country, phone) — international quoting needs all of it, not just state/country.
export async function resolveShippingCost({ subtotal, items = [], shippingAddress = {} }) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return { shippingCost: 0, method: 'free', carrierName: null };
  }

  const settings = await ShippingSettings.getSingleton();
  const { state, country } = shippingAddress;

  if (isNigeria(country)) {
    const rate = state
      ? await ShippingRate.findOne({ state: new RegExp(`^${escapeRegex(state.trim())}$`, 'i'), price: { $ne: null } })
      : null;
    const shippingCost = rate ? rate.price : settings.defaultLocalRate;
    if (shippingCost == null) {
      return { shippingCost: null, method: 'unavailable', carrierName: null };
    }
    return { shippingCost, method: 'local', carrierName: null };
  }

  // International — try a live Terminal Africa/DHL quote, fall back to the admin's flat
  // rate on any failure (unconfigured, unmapped country, API error) rather than block checkout.
  try {
    const quote = await getInternationalShippingQuote({ items, shippingAddress, settings });
    if (quote) return { shippingCost: quote.amount, method: 'international-live', carrierName: quote.carrierName };
  } catch (err) {
    console.error('Terminal Africa quote failed, falling back to flat rate:', err.message);
  }

  if (settings.internationalFlatRate != null) {
    return { shippingCost: settings.internationalFlatRate, method: 'international-flat', carrierName: null };
  }

  return { shippingCost: null, method: 'unavailable', carrierName: null };
}
