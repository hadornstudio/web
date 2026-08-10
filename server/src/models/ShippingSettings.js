import mongoose from 'mongoose';

const { Schema } = mongoose;

// Singleton document (always the same fixed _id) — safety-net rates used when a specific
// state hasn't been priced yet, or when the international carrier API is unavailable/unset,
// plus the shop's pickup-address details Terminal Africa needs to quote international rates.
const SINGLETON_ID = 'shipping-settings';

const shippingSettingsSchema = new Schema(
  {
    _id: { type: String, default: SINGLETON_ID },
    defaultLocalRate: { type: Number, min: 0 },
    internationalFlatRate: { type: Number, min: 0 },

    // Origin (pickup) address for Terminal Africa quotes — admin-editable in the same
    // shipping settings panel, defaults reflect the shop's actual location.
    originLine1: { type: String, trim: true, default: '' },
    originCity: { type: String, trim: true, default: 'Osogbo' },
    originState: { type: String, trim: true, default: 'Osun' },
    originPhone: { type: String, trim: true, default: '' },

    // Cached Terminal Africa resource IDs — created once on first successful quote
    // request, reused after that instead of re-registering the same address/box.
    terminalPackagingId: { type: String, select: false },
    terminalPickupAddressId: { type: String, select: false },
  },
  { timestamps: true }
);

shippingSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findById(SINGLETON_ID).select('+terminalPackagingId +terminalPickupAddressId');
  if (!doc) doc = await this.create({ _id: SINGLETON_ID });
  return doc;
};

export default mongoose.model('ShippingSettings', shippingSettingsSchema);
