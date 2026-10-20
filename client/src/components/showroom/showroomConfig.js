// Everything editable about the showroom lives here. Distances are in metres.
export const SHOWROOM = {
  title: 'The Gallery',
  subline: "A collection of pieces we've made",
  hint: {
    touch: 'Tap the floor lights to walk through',
    desktop: 'Click the floor lights or scroll to walk through',
    inspectTouch: 'Drag to turn it · pinch to zoom',
    inspectDesktop: 'Drag to turn it · scroll to zoom · Esc to step back',
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
  // A piece with a 3D model stands on a round plinth this far out from its wall.
  plinth: { distance: 1.3, radius: 0.5, height: 0.16 },
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
    model: item.model?.url ? item.model : null,
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

// A work that has a 3D model stands on a plinth; the viewer looks at the model rather than at a wall photo.
export function modelGeometry(index, work, aspect, inspecting = false, hall = SHOWROOM.hall) {
  const { side, z } = bayLayout(index, hall);
  const { distance, height: plinthH } = SHOWROOM.plinth;
  const H = work.model.height ?? 1.7;
  const x = side * (hall.width / 2 - distance); // plinth centre
  const centreY = plinthH + H * 0.5 + (work.model.offsetY ?? 0);
  const fov = (baseFov(aspect) * Math.PI) / 180;
  const fit = (H * 1.3) / 2 / Math.tan(fov / 2); // distance at which the whole piece fills the view height
  // Portrait screens: the story card covers the lower third, so the close-up stands back further to keep the whole piece above it.
  const portrait = Math.min(1, Math.max(0, (1.7 - aspect) / 1.1));
  const dist = inspecting ? Math.max(1.0, fit * (0.98 + portrait * 0.5)) : Math.max(2.4, fit * 1.3);
  return { side, z, x, centreY, plinthH, standX: x - side * dist, dist };
}
