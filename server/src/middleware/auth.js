import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from './asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated — missing token');
  }

  const token = header.split(' ')[1];
  // Pin the algorithm explicitly — without this, jsonwebtoken will accept whatever
  // algorithm the token itself claims, which is how algorithm-confusion attacks work.
  const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Not authenticated — user not found or inactive');
  }

  req.user = user;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to perform this action');
  }
  next();
};
