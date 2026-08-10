import { necklaceImages, braceletImages, earringImages, ankletImages, craftImages } from './images.js';

export const categoriesData = [
  {
    name: 'Necklaces',
    type: 'necklaces',
    description: 'Beaded and gemstone necklaces, hand-strung one at a time.',
    image: necklaceImages[3],
    sortOrder: 1,
  },
  {
    name: 'Bracelets',
    type: 'bracelets',
    description: 'Everyday and statement bracelets in freshwater pearl, stone, and metal.',
    image: braceletImages[1],
    sortOrder: 2,
  },
  {
    name: 'Earrings',
    type: 'earrings',
    description: 'Lightweight beaded and metal earrings for daily wear or evening.',
    image: earringImages[0],
    sortOrder: 3,
  },
  {
    name: 'Anklets',
    type: 'anklets',
    description: 'Delicate beaded anklets, singly or layered.',
    image: ankletImages[0],
    sortOrder: 4,
  },
  {
    name: 'Custom & Made-to-Order',
    type: 'custom',
    description: 'Bespoke pieces designed around your reference, palette, or occasion.',
    image: craftImages[0],
    sortOrder: 5,
  },
];
