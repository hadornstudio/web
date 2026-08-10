import GalleryItem from '../models/GalleryItem.js';
import Like from '../models/Like.js';
import Category from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Admin forms send '' for "no product/category selected" — strip those before they reach
// Mongoose, which would otherwise try (and fail) to cast an empty string to an ObjectId.
function sanitizeRefFields(body) {
  const payload = { ...body };
  if (!payload.product) delete payload.product;
  if (!payload.category) delete payload.category;
  return payload;
}

const SORTS = {
  likes: { likesCount: -1, createdAt: -1 },
  newest: { createdAt: -1 },
};

export const listGalleryItems = asyncHandler(async (req, res) => {
  const { category, sort } = req.query;
  const filter = { isActive: true };

  if (category) {
    const categoryDoc = await Category.findOne({ slug: category });
    filter.category = categoryDoc ? categoryDoc._id : null; // null -> no results, not an error, for an unknown slug
  }

  const sortBy = SORTS[sort] || { sortOrder: 1, createdAt: -1 };

  const items = await GalleryItem.find(filter)
    .populate('category', 'name slug')
    .populate('product', 'title slug')
    .sort(sortBy);

  res.json({ success: true, data: { items } });
});

// Auth required: which of the current items has this user already liked, so the
// gallery grid can render filled/outline hearts correctly on load.
export const getMyLikedGalleryItemIds = asyncHandler(async (req, res) => {
  const likes = await Like.find({ user: req.user._id }).select('galleryItem');
  res.json({ success: true, data: { galleryItemIds: likes.map((l) => l.galleryItem) } });
});

export const toggleLike = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Gallery item not found');

  const existing = await Like.findOne({ user: req.user._id, galleryItem: item._id });

  if (existing) {
    await Like.findOneAndDelete({ _id: existing._id });
    const updated = await GalleryItem.findById(item._id);
    return res.json({ success: true, data: { liked: false, likesCount: updated.likesCount } });
  }

  await Like.create({ user: req.user._id, galleryItem: item._id });
  const updated = await GalleryItem.findById(item._id);
  res.json({ success: true, data: { liked: true, likesCount: updated.likesCount } });
});

// ---- Admin ----

export const listAllGalleryItemsAdmin = asyncHandler(async (req, res) => {
  const items = await GalleryItem.find()
    .populate('product', 'title slug')
    .populate('category', 'name slug')
    .sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, data: { items } });
});

export const createGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.create(sanitizeRefFields(req.body));
  res.status(201).json({ success: true, data: { item } });
});

export const updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findByIdAndUpdate(req.params.id, sanitizeRefFields(req.body), {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, 'Gallery item not found');
  res.json({ success: true, data: { item } });
});

export const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!item) throw new ApiError(404, 'Gallery item not found');
  res.json({ success: true, message: 'Gallery item deactivated' });
});

// The lead list: every like, newest first, with the liker's contact info and which
// piece they liked — this is what the admin uses to follow up ("marketing strategy").
export const listLikesAdmin = asyncHandler(async (req, res) => {
  const likes = await Like.find()
    .populate('user', 'name email phone')
    .populate('galleryItem', 'title images')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { likes } });
});
