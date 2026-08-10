const FLAT_SHIPPING_COST = 3500; // ₦3,500
const FREE_SHIPPING_THRESHOLD = 150000; // ₦150,000
const TAX_RATE = 0.075; // Nigerian VAT

export function calculateOrderTotals({ items, discountAmount = 0 }) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING_COST;
  const discountTotal = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(subtotal - discountTotal, 0);
  const tax = Math.round(taxableAmount * TAX_RATE);
  const total = Math.round(taxableAmount + tax + shippingCost);

  return { subtotal, shippingCost, tax, discountTotal, total };
}
