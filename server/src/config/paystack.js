const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function paystackFetch(path, options = {}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!json.status) {
    const err = new Error(json.message || 'Paystack request failed');
    err.paystackResponse = json;
    throw err;
  }
  return json.data;
}

export function initializeTransaction({ email, amountInKobo, metadata }) {
  return paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({ email, amount: amountInKobo, currency: 'NGN', metadata }),
  });
}

export function verifyTransaction(reference) {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });
}
