import mongoose from 'mongoose';

const { Schema } = mongoose;

const promoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    bannerImage: { type: String },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    startsAt: { type: Date },
    endsAt: { type: Date },
    isActive: { type: Boolean, default: true },
    announcedAt: { type: Date },
  },
  { timestamps: true }
);

promoSchema.methods.isLive = function isLive() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startsAt && this.startsAt > now) return false;
  if (this.endsAt && this.endsAt < now) return false;
  return true;
};

export default mongoose.model('Promo', promoSchema);
