import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 50);

  const filter = { product: req.params.productId };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, data: { reviews, page: pageNum, pages: Math.ceil(total / limitNum), total } });
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  const verifyingOrder = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
  });

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title,
    comment,
    isVerifiedPurchase: Boolean(verifyingOrder),
    order: verifyingOrder?._id,
  });

  res.status(201).json({ success: true, data: { review } });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (String(review.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own review');
  }

  Object.assign(review, req.body);
  await review.save();

  res.json({ success: true, data: { review } });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  const isOwner = String(review.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to delete this review');
  }

  await Review.findOneAndDelete({ _id: review._id });
  res.json({ success: true, message: 'Review deleted' });
});
