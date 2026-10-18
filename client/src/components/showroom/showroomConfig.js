// Everything editable about the showroom lives here. Distances are in metres.
export const SHOWROOM = {
  title: 'The Gallery',
  subline: "A collection of pieces we've made",
  hint: {
    touch: 'Tap the floor lights to walk through',
    desktop: 'Click the floor lights or scroll to walk through',
  },
  filmHint: 'Scroll to turn the lights on',
  film: {
    autoplayAfterMs: 2000, // plays by itself if the visitor hasn't scrolled by then
    durationSec: 8,
    wheelPxForFullFilm: 2400,
    crossfadeSec: 0.8,
  },
  hall: { width: 9, height: 4, bayGap: 5, firstBayZ: -2, startZ: 8, eyeHeight: 1.6 },
  travelSec: 1.2,
  ctaLabel: 'Order something similar',
};

export function bayLayout(i, hall = SHOWROOM.hall) {
  return { side: i % 2 === 0 ? -1 : 1, z: hall.firstBayZ - Math.floor(i / 2) * hall.bayGap };
}

export function hallEndZ(count, hall = SHOWROOM.hall) {
  return hall.firstBayZ - Math.max(0, Math.ceil(count / 2) - 1) * hall.bayGap - 7;
}

// Adapts a Gallery item (title, description, photos, optional linked product) into a showroom work.
export function toWorks(items = []) {
  return items.map((item) => ({
    id: item._id,
    title: item.title,
    year: item.createdAt ? new Date(item.createdAt).getFullYear() : null,
    category: item.category?.name || null,
    story: item.description || '',
    images: item.images || [],
    productSlug: item.product?.slug || null,
  }));
}

// Where the visitor stands in front of a bay. Portrait screens stand further back so the frame still fits.
export function standDistance(aspect) {
  return Math.min(4.2, 2.7 + Math.max(0, 1.7 - aspect) * 1.6);
}

// Portrait screens also get a wider lens so a 2.2 m frame still fits across a phone.
export function baseFov(aspect) {
  return 50 + Math.min(16, Math.max(0, 1.4 - aspect) * 22);
}
