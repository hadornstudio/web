// Client for Terminal Africa's T-Ship API (https://docs.terminal.africa/tship) — the
// aggregator we use to reach DHL rates for international shipments. Field names below
// are verified against their published docs as of this integration (Aug 2026); Terminal
// Africa may add fields over time but these are the confirmed required ones.
const BASE_URL = 'https://api.terminal.africa/v1';

async function terminalFetch(path, options = {}) {
  if (!process.env.TERMINAL_AFRICA_SECRET_KEY) {
    throw new Error('TERMINAL_AFRICA_SECRET_KEY is not configured');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.TERMINAL_AFRICA_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const json = await res.json();
  if (!res.ok || json.status === false) {
    const err = new Error(json.message || `Terminal Africa request failed (${res.status})`);
    err.terminalResponse = json;
    throw err;
  }
  return json.data;
}

export function createPackaging({ name, type, length, width, height, weight }) {
  return terminalFetch('/packaging', {
    method: 'POST',
    body: JSON.stringify({
      name,
      type, // 'box' | 'envelope' | 'soft-packaging'
      length,
      width,
      height,
      size_unit: 'cm',
      weight,
      weight_unit: 'kg',
    }),
  });
}

export function createAddress({ name, phone, email, line1, line2, city, state, zip, country }) {
  return terminalFetch('/addresses', {
    method: 'POST',
    body: JSON.stringify({ name, phone, email, line1, line2, city, state, zip, country }),
  });
}

export function createParcel({ items, packagingId, description }) {
  return terminalFetch('/parcels', {
    method: 'POST',
    body: JSON.stringify({
      items,
      packaging: packagingId,
      weight_unit: 'kg',
      description,
    }),
  });
}

export function getRates({ pickupAddressId, deliveryAddressId, parcelId, currency = 'NGN' }) {
  const params = new URLSearchParams({
    pickup_address: pickupAddressId,
    delivery_address: deliveryAddressId,
    parcel_id: parcelId,
    currency,
  });
  return terminalFetch(`/rates/shipment?${params.toString()}`);
}
