import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal, items = [] } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Coupon code not found');

  const userRedemptionCount = await Order.countDocuments({
    user: req.user._id,
    'coupon.code': coupon.code,
    status: { $ne: 'cancelled' },
  });

  // Never trust category/quantity from the client — re-resolve each line's product
  // category server-side before checking the coupon's conditional-quantity rule.
  let resolvedItems = [];
  let conditionCategoryName;
  if (coupon.conditions?.minQuantity) {
    const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } }).select('category');
    const categoryByProduct = new Map(products.map((p) => [String(p._id), p.category]));
    resolvedItems = items.map((i) => ({ category: categoryByProduct.get(String(i.productId)), quantity: i.quantity }));

    if (coupon.conditions.minQuantityCategory) {
      const category = await Category.findById(coupon.conditions.minQuantityCategory).select('name');
      conditionCategoryName = category?.name;
    }
  }

  const result = coupon.isValidFor({ subtotal, userRedemptionCount, items: resolvedItems, conditionCategoryName });
  if (!result.valid) throw new ApiError(400, result.reason);

  const discountAmount = coupon.calculateDiscount(subtotal);

  res.json({
    success: true,
    data: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    },
  });
});

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: { coupons } });
});

// Admin form selects send '' for an unset optional category — Mongoose would otherwise
// throw a CastError trying to cast '' to ObjectId, so strip it before it reaches the model.
function sanitizeConditions(body) {
  if (!body.conditions) return body;
  if (!body.conditions.minQuantityCategory) delete body.conditions.minQuantityCategory;
  if (!body.conditions.minQuantity) delete body.conditions.minQuantity;
  return body;
}

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(sanitizeConditions(req.body));
  res.status(201).json({ success: true, data: { coupon } });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, sanitizeConditions(req.body), {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, data: { coupon } });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, message: 'Coupon deactivated' });
});
