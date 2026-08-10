import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    material: { type: String, trim: true },
    priceDelta: { type: Number, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 240 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String, required: true }],
    basePrice: { type: Number, required: true, min: 0 },
    variants: { type: [variantSchema], default: [] },
    stock: { type: Number, min: 0, default: 0 },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock', 'made_to_order'],
      default: 'in_stock',
    },
    materials: [{ type: String, trim: true }],
    colors: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true, lowercase: true }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0, min: 0 },
    weight: { type: Number },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ basePrice: 1 });

productSchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.title) {
    this.slug = `${slugify(this.title)}-${Math.random().toString(36).slice(2, 7)}`;
  }
  next();
});

const LOW_STOCK_THRESHOLD = 5;

productSchema.pre('save', function deriveStockStatus(next) {
  if (this.stockStatus === 'made_to_order') return next();

  const totalStock = this.variants.length
    ? this.variants.reduce((sum, v) => sum + v.stock, 0)
    : this.stock;

  if (totalStock <= 0) this.stockStatus = 'out_of_stock';
  else if (totalStock <= LOW_STOCK_THRESHOLD) this.stockStatus = 'low_stock';
  else this.stockStatus = 'in_stock';

  next();
});

productSchema.virtual('effectivePriceRange').get(function effectivePriceRange() {
  // `variants` (and even `basePrice`) may be missing entirely on a partial-projection
  // populate (e.g. .populate('product', 'title slug')) — guard rather than assume the
  // full document is loaded, since this getter runs on every toJSON/toObject call.
  if (this.basePrice === undefined || !this.variants?.length) {
    return { min: this.basePrice, max: this.basePrice };
  }
  const prices = this.variants.map((v) => this.basePrice + v.priceDelta);
  return { min: Math.min(...prices), max: Math.max(...prices) };
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);
