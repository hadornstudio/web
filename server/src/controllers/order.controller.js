import { verifyTransaction } from '../config/paystack.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import { resolveCartItems } from '../utils/resolveCartItems.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { items, couponCode, shippingAddress, reference, notes } = req.body;

  const existingOrder = await Order.findOne({ 'payment.reference': reference });
  if (existingOrder) throw new ApiError(409, 'This payment has already been used for an order');

  const { resolvedItems, coupon, subtotal, shippingCost, tax, discountTotal, total } =
    await resolveCartItems({ items, couponCode, userId: req.user._id });

  const transaction = await verifyTransaction(reference);
  if (transaction.status !== 'success') {
    throw new ApiError(402, `Payment has not succeeded (status: ${transaction.status})`);
  }
  if (transaction.metadata?.userId !== String(req.user._id)) {
    throw new ApiError(403, 'This payment does not belong to the current user');
  }
  if (transaction.amount !== Math.round(total * 100)) {
    throw new ApiError(409, 'Payment amount does not match the current cart total');
  }

  // Decrement stock now that payment is confirmed.
  for (const item of resolvedItems) {
    const product = item.productDoc;
    if (product.stockStatus === 'made_to_order') continue;

    if (item.variantId) {
      product.variants.id(item.variantId).stock -= item.quantity;
    } else {
      product.stock -= item.quantity;
    }
    await product.save();
  }

  if (coupon) {
    await Coupon.findByIdAndUpdate(coupon.couponId, { $inc: { usedCount: 1 } });
  }

  const order = await Order.create({
    user: req.user._id,
    items: resolvedItems.map(({ productDoc, ...item }) => item),
    shippingAddress,
    coupon: coupon ? { code: coupon.code, type: coupon.type, value: coupon.value, discountAmount: coupon.discountAmount } : undefined,
    subtotal,
    shippingCost,
    tax,
    discountTotal,
    total,
    payment: {
      provider: 'paystack',
      reference,
      status: 'paid',
      paidAt: new Date(),
    },
    status: 'paid',
    statusHistory: [{ status: 'paid', changedAt: new Date(), note: 'Payment confirmed via Paystack' }],
    notes,
  });

  res.status(201).json({ success: true, data: { order } });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { orders } });
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, data: { order } });
});

// ---- Admin ----

export const listOrdersAdmin = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: { orders } });
});

export const getOrderByIdAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, data: { order } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  order.pushStatus(status, note);
  await order.save();

  res.json({ success: true, data: { order } });
});
