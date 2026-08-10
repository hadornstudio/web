import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const RECOMMENDATION_SIZE = 8;

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

export const listAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { addresses: req.user.addresses } });
});

export const addAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    req.user.addresses.forEach((a) => { a.isDefault = false; });
  }
  req.user.addresses.push(req.body);
  await req.user.save();
  res.status(201).json({ success: true, data: { addresses: req.user.addresses } });
});

const ADDRESS_FIELDS = ['label', 'fullName', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'phone', 'isDefault'];

export const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');

  if (req.body.isDefault) {
    req.user.addresses.forEach((a) => { a.isDefault = false; });
  }
  // Copy only known fields rather than Object.assign(address, req.body) — keeps this
  // immune to extra/unexpected keys in the request body regardless of how the address
  // subdocument's schema evolves later.
  for (const field of ADDRESS_FIELDS) {
    if (req.body[field] !== undefined) address[field] = req.body[field];
  }
  await req.user.save();
  res.json({ success: true, data: { addresses: req.user.addresses } });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');

  address.deleteOne();
  await req.user.save();
  res.json({ success: true, data: { addresses: req.user.addresses } });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');

  req.user.addresses.forEach((a) => { a.isDefault = String(a._id) === String(address._id); });
  await req.user.save();
  res.json({ success: true, data: { addresses: req.user.addresses } });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    match: { isActive: true },
    populate: { path: 'category', select: 'name slug' },
  });
  res.json({ success: true, data: { wishlist: user.wishlist } });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!req.user.wishlist.some((id) => String(id) === productId)) {
    req.user.wishlist.push(productId);
    await req.user.save();
  }
  res.json({ success: true, data: { wishlist: req.user.wishlist } });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  req.user.wishlist = req.user.wishlist.filter((id) => String(id) !== req.params.productId);
  await req.user.save();
  res.json({ success: true, data: { wishlist: req.user.wishlist } });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const { categories, onboarded } = req.body;
  if (categories !== undefined) req.user.preferences.categories = categories;
  if (onboarded !== undefined) req.user.preferences.onboarded = onboarded;
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

// Personalized "For You" dashboard. New/unpreferenced users get a broad random mix —
// as real signal accumulates (explicit preferences, wishlist, paid orders), pickedForYou
// narrows toward their categories while discover stays a random sample on purpose, so the
// dashboard never feels like a closed loop of the same handful of items.
export const getRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('preferences wishlist');

  const paidOrders = await Order.find({ user: req.user._id, 'payment.status': 'paid' }).select('items.product');
  const purchasedProductIds = [...new Set(paidOrders.flatMap((o) => o.items.map((i) => String(i.product))))];

  const [wishlistProducts, purchasedProducts] = await Promise.all([
    Product.find({ _id: { $in: user.wishlist } }).select('category'),
    Product.find({ _id: { $in: purchasedProductIds } }).select('category'),
  ]);

  const signalCategoryIds = [
    ...new Set(
      [...(user.preferences?.categories || []), ...wishlistProducts.map((p) => p.category), ...purchasedProducts.map((p) => p.category)].map(String)
    ),
  ];

  const excludeIds = [...new Set([...user.wishlist.map(String), ...purchasedProductIds])];
  const excludeObjectIds = excludeIds.map((id) => new mongoose.Types.ObjectId(id));

  let pickedForYou;
  const personalized = signalCategoryIds.length > 0;

  if (personalized) {
    pickedForYou = await Product.find({
      category: { $in: signalCategoryIds },
      isActive: true,
      _id: { $nin: excludeObjectIds },
    })
      .populate('category', 'name slug')
      .sort({ ratingsAverage: -1, isFeatured: -1 })
      .limit(RECOMMENDATION_SIZE);
  } else {
    const sampled = await Product.aggregate([
      { $match: { isActive: true, _id: { $nin: excludeObjectIds } } },
      { $sample: { size: RECOMMENDATION_SIZE } },
    ]);
    pickedForYou = await Product.populate(sampled, { path: 'category', select: 'name slug' });
  }

  const seenIds = excludeObjectIds.concat(pickedForYou.map((p) => new mongoose.Types.ObjectId(p._id)));
  const discoverSampled = await Product.aggregate([
    { $match: { isActive: true, _id: { $nin: seenIds } } },
    { $sample: { size: RECOMMENDATION_SIZE } },
  ]);
  const discover = await Product.populate(discoverSampled, { path: 'category', select: 'name slug' });

  res.json({ success: true, data: { pickedForYou, discover, personalized } });
});

// ---- Admin ----

export const listUsersAdmin = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, data: { users: users.map((u) => u.toSafeJSON()) } });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) throw new ApiError(422, 'Invalid role');

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});
