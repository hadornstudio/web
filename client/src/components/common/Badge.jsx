const TONES = {
  neutral: 'bg-stone-100 text-stone-600',
  accent: 'bg-accent-tint text-accent-dark',
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
};

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs uppercase tracking-wide ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
