import { useRef } from 'react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/motion/gsapConfig';
import { useGalleryLikes } from '../../hooks/useGallery';
import { useAuthStore } from '../../store/useAuthStore';

export default function GalleryLikeButton({ itemId, likesCount = 0, className = '' }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isLiked, toggleLike } = useGalleryLikes();
  const btnRef = useRef(null);
  const liked = isLiked(itemId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    if (!prefersReducedMotion() && btnRef.current) {
      gsap
        .timeline()
        .to(btnRef.current, { scale: 1.2, duration: 0.15, ease: EASE.hover })
        .to(btnRef.current, { scale: 1, duration: 0.25, ease: EASE.reveal });
    }

    toggleLike(itemId);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      disabled={!isAuthenticated}
      className={`inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40 ${
        liked ? 'text-accent' : 'text-stone-600 hover:text-accent'
      } ${className}`}
      aria-label="Like this piece"
      title={isAuthenticated ? 'Like this piece' : 'Sign in to like'}
    >
      <svg width="16" height="15" viewBox="0 0 20 18" fill={liked ? 'currentColor' : 'none'}>
        <path
          d="M10 17S1 11.5 1 5.8C1 2.7 3.3 1 5.7 1c1.6 0 3.2.9 4.3 2.4C11.1 1.9 12.7 1 14.3 1 16.7 1 19 2.7 19 5.8 19 11.5 10 17 10 17z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
      {likesCount > 0 && <span>{likesCount}</span>}
    </button>
  );
}
