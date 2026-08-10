import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new ApiError(400, 'Only image files are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadSingle = upload.single('image');

// Ad campaigns accept image or video creative, and video files run larger — separate
// multer config so the existing 5MB/image-only upload path (products, categories,
// gallery, inquiries) stays exactly as strict as it was.
const adMediaFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
    return cb(new ApiError(400, 'Only image or video files are allowed'));
  }
  cb(null, true);
};

const adMediaUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: adMediaFilter,
});

export const uploadAdMedia = adMediaUpload.single('media');
