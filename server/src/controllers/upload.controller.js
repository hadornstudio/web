import { cloudinary } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function streamUpload(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'hadorn', ...options }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file was provided');

  const result = await streamUpload(req.file.buffer);

  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id },
  });
});

// resource_type 'auto' lets Cloudinary accept either image or video in one endpoint —
// the default resource_type is 'image', which rejects video uploads outright.
export const uploadAdMediaFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file was provided');

  const result = await streamUpload(req.file.buffer, { resource_type: 'auto', folder: 'hadorn/ads' });

  res.status(201).json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      mediaType: result.resource_type === 'video' ? 'video' : 'image',
    },
  });
});
