import Category from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, data: { categories } });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: { category } });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: { category } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: { category } });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deactivated' });
});

// Admin-only: list all categories including inactive ones.
export const listAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, data: { categories } });
});
