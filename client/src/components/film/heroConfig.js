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

  // The old glass cards were placeholder copy; the name tags below replaced them. Kept as an empty list
  // so cards ({ at, side, label, title, text }) can be added back without touching the component.
  cards: [],
  cardWindow: 0.12,

  // Name tags: a dot sits on the item, a line draws out to a glass label. Positions are fractions of the
  // FULL FILM FRAME (x, y from the top-left), measured on the final boutique shot, so they follow the
  // picture at any screen size. PLACEHOLDER NAMES — rename freely.
  //   at / until: scroll progress when the tag draws in / fades out
  //   anchor:     the item     label: where the line ends     align: which side of that point the label sits
  tags: [
    { id: 'necklaces', name: 'Beaded necklaces', at: 0.74, anchor: [0.516, 0.48], label: [0.66, 0.6], align: 'left' },
    { id: 'robe', name: 'African-print robe', at: 0.79, anchor: [0.309, 0.47], label: [0.1, 0.17], align: 'left' },
    { id: 'runner', name: 'Printed table runner', at: 0.84, anchor: [0.547, 0.78], label: [0.65, 0.9], align: 'left' },
    { id: 'rack', name: 'Ready-to-wear', at: 0.88, anchor: [0.871, 0.42], label: [0.8, 0.17], align: 'left' },
    { id: 'jewellery', name: 'Cuffs & bangles', at: 0.92, anchor: [0.9375, 0.82], label: [0.76, 0.77], align: 'left' },
  ],
  // The phone frames are the centre 9:16 slice of the 16:9 film: x runs from `x0` for a width of `w` (fractions of the film).
  mobileCrop: { x0: 0.342, w: 0.316 },

  finalCta: { appearAt: 0.92, text: 'Step inside the collection', label: 'Shop the collection', to: '/shop' },
};
