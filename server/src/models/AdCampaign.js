import mongoose from 'mongoose';

const { Schema } = mongoose;

const PLACEMENTS = ['homepage-banner', 'shop-banner', 'gallery-banner'];

const adCampaignSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mediaUrl: { type: String, required: true },
    // What clicking the ad does — at most one of promo/product/category/url is used,
    // selected by linkType. 'none' renders a plain non-clickable banner.
    linkType: { type: String, enum: ['promo', 'product', 'category', 'url', 'none'], default: 'none' },
    promo: { type: Schema.Types.ObjectId, ref: 'Promo' },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    url: { type: String, trim: true },
    placement: { type: String, enum: PLACEMENTS, required: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

adCampaignSchema.index({ placement: 1, isActive: 1 });

adCampaignSchema.methods.isLive = function isLive() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startsAt && this.startsAt > now) return false;
  if (this.endsAt && this.endsAt < now) return false;
  return true;
};

export { PLACEMENTS };
export default mongoose.model('AdCampaign', adCampaignSchema);
