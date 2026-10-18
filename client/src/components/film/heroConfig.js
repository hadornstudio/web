// Everything editable about the home scroll film lives here. Progress values are 0..1 of the
// pinned scroll distance.
export const HERO_CONFIG = {
  scrollScreens: { desktop: 5, mobile: 4 }, // pinned scroll length, in viewport heights
  slowStart: { until: 0.08, frameShare: 0.03 },
  headerOffset: 80, // sticky header height in px (h-20)
  cropRight: { desktop: 0.04, mobile: 0 }, // frame 1 has a thin black strip on the right edge

  brand: {
    tagline: 'Handcrafted beadwork · Attire · Accessories',
    line: 'Made by hand, worn with pride.',
    cta: { label: 'Shop the collection', to: '/shop' },
    scrollCue: 'Scroll to step inside',
  },

  // Wordmark rises once the curtain has parted, then swells and fades as the camera "walks through".
  wordmark: { appearAt: 0.1, fadeStart: 0.22, fadeEnd: 0.36, scaleTo: 1.4, spread: 40 },
  // Tagline, line and CTA fade out before the wordmark does.
  textFadeOut: { start: 0.17, end: 0.24 },

  // PLACEHOLDER COPY — replace with the owner's wording.
  cards: [
    { at: 0.42, side: 'left', label: 'Beadwork', title: 'Strung by hand', text: 'Every piece is made bead by bead, one at a time.' },
    { at: 0.62, side: 'right', label: 'The collection', title: 'Necklaces, bracelets & earrings', text: 'Pieces for every day and for the moments in between.' },
    { at: 0.8, side: 'left', label: 'Made to order', title: 'Something of your own', text: 'Choose your colours and materials, or tell us what you have in mind.' },
  ],
  cardWindow: 0.12, // how much scroll each card stays on screen

  finalCta: { appearAt: 0.92, text: 'Step inside the collection', label: 'Shop the collection', to: '/shop' },
};
