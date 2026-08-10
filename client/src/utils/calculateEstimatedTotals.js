// Mirrors server/src/utils/calculateOrderTotals.js — for display estimates only.
// shippingCost is resolved separately via useShippingQuote (real per-state / carrier
// rates can't be duplicated client-side). The server always recalculates authoritatively
// at payment-initialize and order-creation time.
const TAX_RATE = 0.075;

export function calculateEstimatedTotals({ subtotal, discountAmount = 0, shippingCost = 0 }) {
  const discountTotal = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(subtotal - discountTotal, 0);
  const tax = Math.round(taxableAmount * TAX_RATE);
  const total = Math.round(taxableAmount + tax + shippingCost);

  return { shippingCost, tax, discountTotal, total };
}
