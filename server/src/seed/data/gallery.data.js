const u = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

export const galleryItemsData = [
  {
    title: 'Woven Fabric Cuff Study',
    description: 'A hand-loomed bead-on-fabric cuff, built row by row rather than strung — part of an ongoing series exploring density and color-blending.',
    images: [u('1715374033196-0ff662284a7e')],
    categoryType: 'bracelets',
    sortOrder: 0,
  },
  {
    title: 'Studio Bench, Mid-Strand',
    description: 'A necklace strand caught mid-assembly, beads sorted by tone before a single knot is tied.',
    images: [u('1522065893269-6fd20f6d7438')],
    categoryType: 'necklaces',
    sortOrder: 1,
  },
  {
    title: 'Torch-Set Clasp Detail',
    description: 'Hand-soldering a clasp — small, unglamorous work that decides whether a piece holds up for years or falls apart in months.',
    images: [u('1626252685663-64c6bf60afb1')],
    sortOrder: 2,
  },
  {
    title: 'Leather-Carved Pendant, In Progress',
    description: 'Not every material is a bead — some pieces start as hand-carved leather before beadwork is added.',
    images: [u('1444069788560-6ae1deb4c0d4')],
    categoryType: 'necklaces',
    sortOrder: 3,
  },
  {
    title: 'Assembly Table, Gold Hardware',
    description: 'Findings, clasps, and chain laid out before a batch of bracelets goes together.',
    images: [u('1659032882703-f1e4983fe1b8')],
    categoryType: 'bracelets',
    sortOrder: 4,
    linkToProduct: true,
  },
  {
    title: 'Wire-Set Stone Detail',
    description: 'A closer look at how individual stones are wrapped and set before joining a finished strand.',
    images: [u('1626252685643-8a305c55e98d')],
    categoryType: 'earrings',
    sortOrder: 5,
  },
];
