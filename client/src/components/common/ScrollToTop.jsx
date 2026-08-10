import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Browsers restore scroll position on navigation by default within an SPA (no full reload),
// which reads as broken for a multi-page-feeling site — force scroll-to-top on every route change.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Skip when a hash is present (e.g. Footer's "Our Craft" -> /#craft) — the browser/
    // element itself handles scrolling to that anchor, forcing top would fight it.
    if (hash) return;
    // Explicit 'instant' — index.css sets `scroll-behavior: smooth` globally, which would
    // otherwise turn this into a slow animated scroll instead of a clean reset on navigation.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
