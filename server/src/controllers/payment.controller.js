import crypto from 'crypto';
import { initializeTransaction } from '../config/paystack.js';
import Order from '../models/Order.js';
import { resolveCartItems } from '../utils/resolveCartItems.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const initializePayment = asyncHandler(async (req, res) => {
  const { items, couponCode, shippingAddress } = req.body;
  const { total } = await resolveCartItems({ items, couponCode, userId: req.user._id, shippingAddress });

  const amountInKobo = Math.round(total * 100);

  const { authorization_url, access_code, reference } = await initializeTransaction({
    email: req.user.email,
    amountInKobo,
    metadata: { userId: String(req.user._id) },
  });

  res.json({
    success: true,
    data: {
      authorizationUrl: authorization_url,
      accessCode: access_code,
      reference,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      total,
    },
  });
});

export const webhookHandler = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const expected = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Invalid Paystack webhook signature');
  }

  const event = JSON.parse(req.body.toString('utf8'));

  if (event.event === 'charge.success') {
    const { reference } = event.data;
    await Order.findOneAndUpdate(
      { 'payment.reference': reference, 'payment.status': { $ne: 'paid' } },
      { 'payment.status': 'paid', 'payment.paidAt': new Date() }
    );
  }

  res.sendStatus(200);
};
