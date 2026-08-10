import Inquiry from '../models/Inquiry.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendInquiryNotification } from '../utils/sendInquiryNotification.js';

export const createInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.create({ ...req.body, user: req.user?._id });

  // Fire-and-forget — the customer's request shouldn't wait on (or fail because of) email delivery.
  sendInquiryNotification(inquiry);

  res.status(201).json({ success: true, data: { inquiry } });
});

export const listInquiries = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { inquiries } });
});

export const updateInquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'closed'].includes(status)) throw new ApiError(422, 'Invalid status');

  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!inquiry) throw new ApiError(404, 'Inquiry not found');
  res.json({ success: true, data: { inquiry } });
});
