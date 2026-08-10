import { useRef, useState } from 'react';
import { uploadsApi } from '../../api/uploads';

export default function ImageUploadField({ label, value, onChange, multiple = false, endpoint = '/uploads' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const images = multiple ? value || [] : value ? [value] : [];

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadsApi.upload(file, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      }, endpoint);
      const url = res.data.url;
      if (multiple) {
        onChange([...(value || []), url]);
      } else {
        onChange(url);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (idx) => {
    if (multiple) {
      onChange((value || []).filter((_, i) => i !== idx));
    } else {
      onChange('');
    }
  };

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm text-stone-600">{label}</span>}

      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url + i} className="relative h-20 w-20 shrink-0 overflow-hidden border border-stone-300">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-0 top-0 bg-ink/70 px-1.5 text-xs text-paper hover:bg-error"
            >
              ×
            </button>
          </div>
        ))}

        {(multiple || images.length === 0) && (
          <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center border border-dashed border-stone-300 text-xs text-stone-600 hover:border-accent hover:text-accent">
            {uploading ? `${progress}%` : '+ Add'}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
