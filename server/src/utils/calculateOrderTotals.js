const TAX_RATE = 0.075; // Nigerian VAT

// shippingCost is resolved separately (see resolveShippingCost.js) — real per-state and
// international carrier rates, not something this function can compute on its own anymore.
export function calculateOrderTotals({ items, discountAmount = 0, shippingCost = 0 }) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountTotal = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(subtotal - discountTotal, 0);
  const tax = Math.round(taxableAmount * TAX_RATE);
  const total = Math.round(taxableAmount + tax + shippingCost);

  return { subtotal, shippingCost, tax, discountTotal, total };
}
