import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({ success: true, data: { user: user.toSafeJSON(), token } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);
  res.json({ success: true, data: { user: user.toSafeJSON(), token } });
});

export const googleAuth = asyncHandler(async (req, res) => {
  if (!googleClient) throw new ApiError(500, 'Google sign-in is not configured');

  const { credential } = req.body;

  // verifyIdToken checks the signature against Google's public keys, the audience
  // (must match our client ID), issuer, and expiry — a forged/expired/wrong-audience
  // token throws here rather than silently passing through.
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Invalid Google credential');
  }

  if (!payload?.email_verified) {
    throw new ApiError(401, 'Google account email is not verified');
  }

  let user = await User.findOne({ googleId: payload.sub }).select('+googleId');

  if (!user) {
    // Same email as an existing password account — link the two rather than creating a
    // duplicate. Safe to trust here because Google (not the client) verified the email.
    user = await User.findOne({ email: payload.email }).select('+googleId');
    if (user) {
      user.googleId = payload.sub;
      await user.save();
    }
  }

  if (!user) {
    user = await User.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      googleId: payload.sub,
    });
  }

  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);
  res.json({ success: true, data: { user: user.toSafeJSON(), token } });
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — nothing to invalidate server-side in Phase 1.
  // Endpoint kept for API symmetry and a future refresh-token blacklist.
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the account exists, to avoid leaking which emails are registered.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Phase 1 has no email provider wired up — log the reset link for manual testing.
    console.log(`Password reset requested for ${email}. Reset token: ${rawToken}`);
  }

  res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw new ApiError(400, 'Password reset token is invalid or has expired');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const newToken = generateToken(user._id);
  res.json({ success: true, data: { user: user.toSafeJSON(), token: newToken } });
});
