import Promo from '../models/Promo.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendPromoAnnouncement } from '../utils/sendPromoAnnouncement.js';

function sanitizeCoupon(body) {
  if (!body.coupon) delete body.coupon;
  return body;
}

export const listPromosAdmin = asyncHandler(async (req, res) => {
  const promos = await Promo.find().populate('coupon', 'code type value').sort({ createdAt: -1 });
  res.json({ success: true, data: { promos } });
});

export const createPromo = asyncHandler(async (req, res) => {
  const promo = await Promo.create(sanitizeCoupon(req.body));
  res.status(201).json({ success: true, data: { promo } });
});

export const updatePromo = asyncHandler(async (req, res) => {
  const promo = await Promo.findByIdAndUpdate(req.params.id, sanitizeCoupon(req.body), {
    new: true,
    runValidators: true,
  });
  if (!promo) throw new ApiError(404, 'Promo not found');
  res.json({ success: true, data: { promo } });
});

export const deletePromo = asyncHandler(async (req, res) => {
  const promo = await Promo.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!promo) throw new ApiError(404, 'Promo not found');
  res.json({ success: true, message: 'Promo deactivated' });
});

// Kicks off a background bulk send and returns immediately — a real send to even a
// modest customer list takes long enough (staggered, ~150ms+ per email) that the admin
// shouldn't wait on the HTTP request for it to finish.
export const announcePromo = asyncHandler(async (req, res) => {
  const promo = await Promo.findById(req.params.id).populate('coupon', 'code');
  if (!promo) throw new ApiError(404, 'Promo not found');

  const customerCount = await User.countDocuments({ role: 'customer', isActive: true });

  promo.announcedAt = new Date();
  await promo.save();

  sendPromoAnnouncement(promo).catch((err) => console.error('Promo announcement failed:', err.message));

  res.json({
    success: true,
    message: `Announcement is being sent to ${customerCount} customer(s).`,
    data: { promo },
  });
});
