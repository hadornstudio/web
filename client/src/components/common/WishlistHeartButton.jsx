import { useRef } from 'react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/motion/gsapConfig';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuthStore } from '../../store/useAuthStore';

export default function WishlistHeartButton({ productId, className = '' }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isWishlisted, add, remove } = useWishlist();
  const btnRef = useRef(null);
  const wishlisted = isWishlisted(productId);

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

    if (wishlisted) remove(productId);
    else add(productId);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      disabled={!isAuthenticated}
      className={`inline-flex items-center justify-center border p-2.5 transition-colors disabled:opacity-40 ${
        wishlisted
          ? 'border-accent text-accent'
          : 'border-stone-300 text-stone-600 hover:border-accent hover:text-accent'
      } ${className}`}
      aria-label="Toggle wishlist"
      title={isAuthenticated ? 'Save to wishlist' : 'Sign in to save'}
    >
      <svg width="18" height="16" viewBox="0 0 20 18" fill={wishlisted ? 'currentColor' : 'none'}>
        <path
          d="M10 17S1 11.5 1 5.8C1 2.7 3.3 1 5.7 1c1.6 0 3.2.9 4.3 2.4C11.1 1.9 12.7 1 14.3 1 16.7 1 19 2.7 19 5.8 19 11.5 10 17 10 17z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
    </button>
  );
}
