import { useState } from 'react';

export default function Input({ label, error, className = '', id, type, ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (visible ? 'text' : 'password') : type;

  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-1.5 block text-sm text-stone-600">{label}</span>}
      <div className="relative">
        <input
          id={id}
          type={inputType}
          className={`w-full border border-stone-300 bg-paper px-4 py-2.5 text-ink placeholder:text-stone-600/60 focus:border-accent focus:outline-none ${isPassword ? 'pr-11' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-ink"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 3l18 18" />
                <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a16.7 16.7 0 0 1-3.4 4.3M6.5 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a10.2 10.2 0 0 0 4-.8" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <span className="mt-1 block text-sm text-error">{error}</span>}
    </label>
  );
}
