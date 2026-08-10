import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId },
    title: { type: String, required: true },
    image: { type: String },
    variantLabel: { type: String },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    coupon: {
      code: { type: String },
      type: { type: String, enum: ['flat', 'percent'] },
      value: { type: Number },
      discountAmount: { type: Number, default: 0 },
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: {
      provider: { type: String, default: 'paystack' },
      reference: { type: String },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      paidAt: { type: Date },
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    trackingNumber: { type: String },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.reference': 1 });

orderSchema.pre('validate', async function generateOrderNumber(next) {
  if (this.orderNumber) return next();
  const count = await mongoose.model('Order').countDocuments();
  this.orderNumber = `HDN-${100000 + count + 1}`;
  next();
});

orderSchema.methods.pushStatus = function pushStatus(newStatus, note) {
  this.status = newStatus;
  this.statusHistory.push({ status: newStatus, changedAt: new Date(), note });
};

export default mongoose.model('Order', orderSchema);
