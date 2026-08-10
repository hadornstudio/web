import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import { ApiError } from './ApiError.js';
import { calculateOrderTotals } from './calculateOrderTotals.js';

// Re-derives line items, stock availability, and totals directly from the database —
// never trusts prices or availability sent by the client. Shared by payment-intent
// creation and order creation so the amount charged always matches the amount recorded.
export async function resolveCartItems({ items, couponCode, userId }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(422, 'Cart must contain at least one item');
  }

  const resolvedItems = [];

  for (const line of items) {
    const product = await Product.findById(line.productId);
    if (!product || !product.isActive) {
      throw new ApiError(404, `Product not found: ${line.productId}`);
    }

    let unitPrice = product.basePrice;
    let variantLabel;
    let availableStock = product.stock;
    let variant;

    if (line.variantId) {
      variant = product.variants.id(line.variantId);
      if (!variant) throw new ApiError(404, `Variant not found on product "${product.title}"`);
      unitPrice = product.basePrice + variant.priceDelta;
      variantLabel = [variant.color, variant.size, variant.material].filter(Boolean).join(' / ');
      availableStock = variant.stock;
    }

    if (product.stockStatus !== 'made_to_order' && availableStock < line.quantity) {
      throw new ApiError(409, `Not enough stock for "${product.title}"${variantLabel ? ` (${variantLabel})` : ''}`);
    }

    resolvedItems.push({
      product: product._id,
      productDoc: product,
      variantId: variant?._id,
      title: product.title,
      image: product.images[variant?.imageIndex ?? 0] || product.images[0],
      variantLabel,
      unitPrice,
      quantity: line.quantity,
      lineTotal: Math.round(unitPrice * line.quantity * 100) / 100,
    });
  }

  let discountAmount = 0;
  let couponSnapshot;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw new ApiError(404, 'Coupon code not found');

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const userRedemptionCount = await Order.countDocuments({
      user: userId,
      'coupon.code': coupon.code,
      status: { $ne: 'cancelled' },
    });

    let conditionCategoryName;
    if (coupon.conditions?.minQuantityCategory) {
      const category = await Category.findById(coupon.conditions.minQuantityCategory).select('name');
      conditionCategoryName = category?.name;
    }

    const conditionItems = resolvedItems.map((i) => ({ category: i.productDoc.category, quantity: i.quantity }));
    const result = coupon.isValidFor({ subtotal, userRedemptionCount, items: conditionItems, conditionCategoryName });
    if (!result.valid) throw new ApiError(400, result.reason);

    discountAmount = coupon.calculateDiscount(subtotal);
    couponSnapshot = { code: coupon.code, type: coupon.type, value: coupon.value, discountAmount, couponId: coupon._id };
  }

  const totals = calculateOrderTotals({ items: resolvedItems, discountAmount });

  return { resolvedItems, coupon: couponSnapshot, ...totals };
}
