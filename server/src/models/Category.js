import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: String },
    type: {
      type: String,
      enum: ['necklaces', 'bracelets', 'earrings', 'anklets', 'custom'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

export default mongoose.model('Category', categorySchema);
