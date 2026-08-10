import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateProfileValidator,
  changePasswordValidator,
  addressValidator,
  updatePreferencesValidator,
} from '../validators/user.validators.js';
import {
  updateProfile,
  changePassword,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updatePreferences,
  getRecommendations,
  listUsersAdmin,
  updateUserRole,
  updateUserStatus,
} from '../controllers/user.controller.js';

const router = Router();

router.put('/me', protect, updateProfileValidator, validate, updateProfile);
router.put('/me/password', protect, changePasswordValidator, validate, changePassword);
router.put('/me/preferences', protect, updatePreferencesValidator, validate, updatePreferences);
router.get('/me/recommendations', protect, getRecommendations);

router.get('/me/addresses', protect, listAddresses);
router.post('/me/addresses', protect, addressValidator, validate, addAddress);
router.put('/me/addresses/:addressId', protect, updateAddress);
router.delete('/me/addresses/:addressId', protect, deleteAddress);
router.patch('/me/addresses/:addressId/default', protect, setDefaultAddress);

router.get('/me/wishlist', protect, getWishlist);
router.post('/me/wishlist/:productId', protect, addToWishlist);
router.delete('/me/wishlist/:productId', protect, removeFromWishlist);

router.get('/', protect, authorize('admin'), listUsersAdmin);
router.patch('/:id/role', protect, authorize('admin'), updateUserRole);
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);

export default router;
