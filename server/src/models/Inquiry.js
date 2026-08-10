import mongoose from 'mongoose';

const { Schema } = mongoose;

const inquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    description: { type: String, required: true, maxlength: 2000 },
    budgetRange: { type: String, trim: true },
    referenceImages: [{ type: String }],
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

inquirySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Inquiry', inquirySchema);
