import AdCampaign, { PLACEMENTS } from '../models/AdCampaign.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function sanitizeAdRefs(body) {
  if (!body.promo) delete body.promo;
  if (!body.product) delete body.product;
  if (!body.category) delete body.category;
  return body;
}

// Public — used by the storefront's AdSlot component. Only returns ads that are
// active AND currently inside their optional date window.
export const listAdsPublic = asyncHandler(async (req, res) => {
  const { placement } = req.query;
  if (!placement || !PLACEMENTS.includes(placement)) {
    throw new ApiError(400, 'A valid placement is required');
  }

  const now = new Date();
  const ads = await AdCampaign.find({
    placement,
    isActive: true,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
    ],
  })
    .populate({ path: 'promo', populate: { path: 'coupon', select: 'code' } })
    .populate('product', 'title slug')
    .populate('category', 'name slug')
    .sort({ sortOrder: 1, createdAt: -1 });

  res.json({ success: true, data: { ads } });
});

export const listAdsAdmin = asyncHandler(async (req, res) => {
  const ads = await AdCampaign.find()
    .populate('promo', 'title')
    .populate('product', 'title')
    .populate('category', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { ads } });
});

export const createAd = asyncHandler(async (req, res) => {
  const ad = await AdCampaign.create(sanitizeAdRefs(req.body));
  res.status(201).json({ success: true, data: { ad } });
});

export const updateAd = asyncHandler(async (req, res) => {
  const ad = await AdCampaign.findByIdAndUpdate(req.params.id, sanitizeAdRefs(req.body), {
    new: true,
    runValidators: true,
  });
  if (!ad) throw new ApiError(404, 'Ad not found');
  res.json({ success: true, data: { ad } });
});

export const deleteAd = asyncHandler(async (req, res) => {
  const ad = await AdCampaign.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!ad) throw new ApiError(404, 'Ad not found');
  res.json({ success: true, message: 'Ad deactivated' });
});
