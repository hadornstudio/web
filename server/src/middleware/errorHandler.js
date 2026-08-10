import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  if (err.name === 'ValidationError' && err.errors && !(err instanceof ApiError)) {
    statusCode = 422;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field "${err.path}"`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate value';
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};
