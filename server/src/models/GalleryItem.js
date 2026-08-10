import mongoose from 'mongoose';

const { Schema } = mongoose;

const galleryItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    images: [{ type: String, required: true }],
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

galleryItemSchema.index({ isActive: 1, sortOrder: 1 });
galleryItemSchema.index({ category: 1 });

export default mongoose.model('GalleryItem', galleryItemSchema);
