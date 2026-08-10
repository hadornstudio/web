import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.statics.recalculateProductRatings = async function recalculateProductRatings(productId) {
  const Product = mongoose.model('Product');
  const stats = await this.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
      ratingsCount: stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratingsAverage: 0, ratingsCount: 0 });
  }
};

// Returning the promise (not just calling it) matters — Mongoose only awaits post hooks
// that return a promise, otherwise this races with whatever reads the rating right after.
reviewSchema.post('save', function afterSave() {
  return this.constructor.recalculateProductRatings(this.product);
});

reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) return doc.constructor.recalculateProductRatings(doc.product);
});

export default mongoose.model('Review', reviewSchema);
