export default function StarRating({ rating = 0, count, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'text-lg' : 'text-sm';
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${sizeClass} text-accent`} aria-hidden="true">
        {'★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))}
      </span>
      {typeof count === 'number' && <span className="text-sm text-stone-600">({count})</span>}
    </div>
  );
}
