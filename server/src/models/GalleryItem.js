import mongoose from 'mongoose';

const { Schema } = mongoose;

// Optional 3D model of the piece, shown on a plinth in the showroom. `splat` is a Gaussian-splat capture
// (.splat), `glb` a regular mesh. The viewer normalises the file to `height` metres, then applies the
// hand-tuned rotation (degrees, X/Y/Z) and vertical offset, because captures come out at arbitrary angles.
const modelSchema = new Schema(
  {
    url: {
      type: String,
      trim: true,
      maxlength: 500,
      validate: {
        validator: (v) => !v || /^https:\/\//.test(v) || v.startsWith('/models/'),
        message: 'Model URL must be https:// or a /models/ path',
      },
    },
    format: { type: String, enum: ['splat', 'glb'], default: 'splat' },
    height: { type: Number, min: 0.1, max: 4, default: 1.7 },
    rotation: {
      type: [Number],
      default: [0, 0, 0],
      validate: { validator: (v) => v.length === 3 && v.every((n) => Number.isFinite(n) && Math.abs(n) <= 360), message: 'Rotation must be three angles in degrees' },
    },
    offsetY: { type: Number, min: -2, max: 2, default: 0 },
  },
  { _id: false }
);

const galleryItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    images: [{ type: String, required: true }],
    model: { type: modelSchema, default: undefined },
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
