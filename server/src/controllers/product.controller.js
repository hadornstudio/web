import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const SORT_MAP = {
  newest: { createdAt: -1 },
  price_asc: { basePrice: 1 },
  price_desc: { basePrice: -1 },
  rating: { ratingsAverage: -1 },
  featured: { isFeatured: -1, createdAt: -1 },
};

export const listProducts = asyncHandler(async (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    material,
    color,
    availability,
    search,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { isActive: true };

  if (category) {
    const categoryDoc = await Category.findOne({ slug: category });
    if (!categoryDoc) {
      return res.json({
        success: true,
        data: { products: [], page: Number(page), pages: 0, total: 0 },
      });
    }
    filter.category = categoryDoc._id;
  }

  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }

  if (material) filter.materials = material;
  if (color) filter.colors = color;
  if (availability) filter.stockStatus = availability;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 60);
  const skip = (pageNum - 1) * limitNum;
  const sortSpec = SORT_MAP[sort] || SORT_MAP.newest;

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sortSpec).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { products, page: pageNum, pages: Math.ceil(total / limitNum), total },
  });
});

export const listFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(8);
  res.json({ success: true, data: { products } });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
    'category',
    'name slug'
  );
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: { product } });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(4)
    .populate('category', 'name slug');

  res.json({ success: true, data: { products: related } });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: { product } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  Object.assign(product, req.body);
  await product.save();

  res.json({ success: true, data: { product } });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, message: 'Product deactivated' });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { stock, variantId, variantStock } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant) throw new ApiError(404, 'Variant not found');
    variant.stock = variantStock;
  } else if (stock != null) {
    product.stock = stock;
  }

  await product.save();
  res.json({ success: true, data: { product } });
});

// Admin-only: list all products including inactive ones, unpaginated filters kept simple.
export const listAllProductsAdmin = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('category', 'name slug').sort({ createdAt: -1 });
  res.json({ success: true, data: { products } });
});
