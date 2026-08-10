import { createPackaging, createAddress, createParcel, getRates } from '../config/terminalAfrica.js';
import { COUNTRY_CODE_BY_NAME } from '../constants/countries.js';

// Used when a cart item's product has no weight set — a light default for small jewelry.
const DEFAULT_ITEM_WEIGHT_KG = 0.3;

// Terminal Africa requires a registered pickup address + a packaging profile before it
// will quote rates. Both are effectively static for us (same shop, same box), so we
// create them once and cache the IDs on the settings singleton instead of recreating
// them on every quote request.
async function ensureTerminalSetup(settings) {
  if (settings.terminalPackagingId && settings.terminalPickupAddressId) {
    return { packagingId: settings.terminalPackagingId, pickupAddressId: settings.terminalPickupAddressId };
  }
  if (!settings.originLine1 || !settings.originCity || !settings.originState || !settings.originPhone) {
    throw new Error('Origin address is not fully configured in shipping settings');
  }

  const packaging = await createPackaging({
    name: 'Hadorn Jewelry Box',
    type: 'box',
    length: 15,
    width: 10,
    height: 5,
    weight: 0.5,
  });

  const pickupAddress = await createAddress({
    name: 'Hadorn',
    phone: settings.originPhone,
    line1: settings.originLine1,
    city: settings.originCity,
    state: settings.originState,
    country: 'NG',
  });

  settings.terminalPackagingId = packaging.packaging_id;
  settings.terminalPickupAddressId = pickupAddress.address_id;
  await settings.save();

  return { packagingId: packaging.packaging_id, pickupAddressId: pickupAddress.address_id };
}

// Returns { amount, carrierName } in NGN, or null if a quote couldn't be produced for
// any reason (not configured, unmapped country, API error) — callers fall back to the
// admin's flat international rate rather than surface this as a hard failure.
export async function getInternationalShippingQuote({ items, shippingAddress, settings }) {
  if (!process.env.TERMINAL_AFRICA_SECRET_KEY) return null;

  const countryCode = COUNTRY_CODE_BY_NAME[(shippingAddress.country || '').trim().toLowerCase()];
  if (!countryCode) return null;

  const { packagingId, pickupAddressId } = await ensureTerminalSetup(settings);

  const deliveryAddress = await createAddress({
    name: shippingAddress.fullName,
    phone: shippingAddress.phone,
    line1: shippingAddress.line1,
    line2: shippingAddress.line2,
    city: shippingAddress.city,
    state: shippingAddress.state,
    zip: shippingAddress.postalCode,
    country: countryCode,
  });

  const parcelItems = items.map((item) => ({
    description: item.title,
    name: item.title,
    type: 'parcel',
    currency: 'NGN',
    value: item.unitPrice,
    quantity: item.quantity,
    weight: item.weight || DEFAULT_ITEM_WEIGHT_KG,
  }));

  const parcel = await createParcel({
    items: parcelItems,
    packagingId,
    description: 'Hadorn jewelry order',
  });

  const rates = await getRates({
    pickupAddressId,
    deliveryAddressId: deliveryAddress.address_id,
    parcelId: parcel.parcel_id,
    currency: 'NGN',
  });

  if (!rates?.length) return null;

  const dhlRate = rates.find((r) => r.carrier_name?.toLowerCase().includes('dhl'));
  const chosen = dhlRate || [...rates].sort((a, b) => a.amount - b.amount)[0];

  return { amount: chosen.amount, carrierName: chosen.carrier_name };
}
