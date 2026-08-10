import mongoose from 'mongoose';

const { Schema } = mongoose;

const shippingRateSchema = new Schema(
  {
    state: { type: String, required: true, unique: true, trim: true },
    // No default — null/unset means "admin hasn't priced this state yet", distinct from
    // an intentional ₦0 (free shipping to that state).
    price: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('ShippingRate', shippingRateSchema);
