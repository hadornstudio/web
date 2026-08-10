// Mirrors server/src/utils/calculateOrderTotals.js — for display estimates only.
// The server always recalculates authoritatively at payment-initialize and order-creation time.
const FLAT_SHIPPING_COST = 3500;
const FREE_SHIPPING_THRESHOLD = 150000;
const TAX_RATE = 0.075;

export function calculateEstimatedTotals({ subtotal, discountAmount = 0 }) {
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING_COST;
  const discountTotal = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(subtotal - discountTotal, 0);
  const tax = Math.round(taxableAmount * TAX_RATE);
  const total = Math.round(taxableAmount + tax + shippingCost);

  return { shippingCost, tax, discountTotal, total };
}
