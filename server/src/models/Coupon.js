import mongoose from 'mongoose';

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['flat', 'percent'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    // Optional "buy N in category X" condition, layered on top of minOrderValue —
    // together they cover both example cases from the brief ("buy 5 necklaces get 10%
    // off" and "spend ₦300k get 5% off") without needing a separate rules engine.
    conditions: {
      minQuantity: { type: Number, min: 1 },
      minQuantityCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    },
  },
  { timestamps: true }
);


couponSchema.methods.isValidFor = function isValidFor({ subtotal, userRedemptionCount = 0, items = [], conditionCategoryName }) {
  if (!this.isActive) return { valid: false, reason: 'This coupon is no longer active.' };
  if (this.expiresAt && this.expiresAt < new Date()) {
    return { valid: false, reason: 'This coupon has expired.' };
  }
  if (this.usageLimit != null && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'This coupon has reached its usage limit.' };
  }
  if (userRedemptionCount >= this.perUserLimit) {
    return { valid: false, reason: 'You have already used this coupon.' };
  }
  if (subtotal < this.minOrderValue) {
    return { valid: false, reason: `Minimum order value of $${this.minOrderValue} required.` };
  }
  if (this.conditions?.minQuantity) {
    const relevantItems = this.conditions.minQuantityCategory
      ? items.filter((i) => String(i.category) === String(this.conditions.minQuantityCategory))
      : items;
    const matchedQuantity = relevantItems.reduce((sum, i) => sum + i.quantity, 0);
    if (matchedQuantity < this.conditions.minQuantity) {
      const label = conditionCategoryName ? ` of ${conditionCategoryName}` : '';
      return {
        valid: false,
        reason: `Add at least ${this.conditions.minQuantity} item${this.conditions.minQuantity > 1 ? 's' : ''}${label} to use this coupon.`,
      };
    }
  }
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function calculateDiscount(subtotal) {
  let discount = this.type === 'flat' ? this.value : (subtotal * this.value) / 100;
  if (this.maxDiscountAmount != null) {
    discount = Math.min(discount, this.maxDiscountAmount);
  }
  return Math.min(discount, subtotal);
};

export default mongoose.model('Coupon', couponSchema);
