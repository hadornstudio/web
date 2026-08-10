import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  googleAuthValidator,
} from '../validators/auth.validators.js';
import {
  register,
  login,
  googleAuth,
  logout,
  me,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/google', authLimiter, googleAuthValidator, validate, googleAuth);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validate, resetPassword);

export default router;
