import { fileTypeFromBuffer } from 'file-type';
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

// multer's file filter only checks the client-supplied Content-Type header, which is
// trivial to spoof (rename anything.exe with Content-Type: image/png). This sniffs the
// actual file bytes and rejects anything whose real content doesn't match the claimed
// category, before it ever reaches Cloudinary.
async function assertRealFileType(buffer, allowedPrefixes) {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !allowedPrefixes.some((prefix) => detected.mime.startsWith(prefix))) {
    throw new ApiError(400, 'File content does not match an allowed file type');
  }
  return detected;
}

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file was provided');
  await assertRealFileType(req.file.buffer, ['image/']);

  const result = await streamUpload(req.file.buffer);

  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id },
  });
});

// Showroom 3D models. .glb files start with the ASCII magic "glTF"; .splat files are raw 32-byte records, so a
// valid one is a non-empty multiple of 32 bytes. Stored as Cloudinary "raw" assets (served as-is, with CORS).
export const uploadModelFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No model file was provided');
  const { buffer, originalname } = req.file;
  const isGlb = /\.glb$/i.test(originalname);
  if (isGlb && buffer.subarray(0, 4).toString('latin1') !== 'glTF') throw new ApiError(400, 'That is not a valid .glb file');
  if (!isGlb && (buffer.length === 0 || buffer.length % 32 !== 0)) {
    throw new ApiError(400, 'That is not a valid .splat file (convert .ply captures with scripts/ply-to-splat.mjs)');
  }

  const result = await streamUpload(buffer, {
    resource_type: 'raw',
    folder: 'hadorn/models',
    public_id: `${Date.now().toString(36)}-${originalname.replace(/[^a-z0-9.]+/gi, '-').toLowerCase()}`,
  });

  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id, format: isGlb ? 'glb' : 'splat', bytes: buffer.length },
  });
});

// resource_type 'auto' lets Cloudinary accept either image or video in one endpoint —
// the default resource_type is 'image', which rejects video uploads outright.
export const uploadAdMediaFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file was provided');
  await assertRealFileType(req.file.buffer, ['image/', 'video/']);

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
