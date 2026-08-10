import { useRef, useState } from 'react';
import axiosClient from '../../api/axiosClient';

// Separate from ImageUploadField (image-only, used by products/categories/gallery/inquiries)
// since ad creative can be image OR video and needs a different preview element — mixing
// that into the shared field would complicate a component used in several stricter contexts.
export default function AdMediaUploadField({ mediaUrl, mediaType, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('media', file);
      const res = await axiosClient.post('/uploads/ad-media', formData, {
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      onChange({ mediaUrl: res.data.data.url, mediaType: res.data.data.mediaType });
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm text-stone-600">Ad Creative (image or video)</span>

      {mediaUrl && (
        <div className="relative mb-3 max-w-sm overflow-hidden border border-stone-300">
          {mediaType === 'video' ? (
            <video src={mediaUrl} controls className="w-full" />
          ) : (
            <img src={mediaUrl} alt="" className="w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onChange({ mediaUrl: '', mediaType: mediaType || 'image' })}
            className="absolute right-2 top-2 bg-ink/70 px-2 py-1 text-xs text-paper hover:bg-error"
          >
            Remove
          </button>
        </div>
      )}

      <label className="flex h-20 w-40 cursor-pointer flex-col items-center justify-center border border-dashed border-stone-300 text-xs text-stone-600 hover:border-accent hover:text-accent">
        {uploading ? `${progress}%` : mediaUrl ? 'Replace file' : '+ Upload file'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>

      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
