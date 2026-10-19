import { useEffect } from 'react';

const SITE = 'Hadorn Studio';
const DEFAULT_DESCRIPTION =
  'Handcrafted beadwork, attire and accessories — necklaces, bracelets, earrings and anklets, made by hand.';

// Sets the tab title and meta description for the current route.
export function usePageMeta({ title, description } = {}) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE}` : `${SITE} — Handcrafted Beading & Jewelry`;
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute('content', (description || DEFAULT_DESCRIPTION).slice(0, 160));
  }, [title, description]);
}
