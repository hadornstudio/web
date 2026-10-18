// Configurator definitions for the 3D product pages. PLACEHOLDER PRICES — the deltas below are
// starting points for the owner to adjust (edit here and re-run `npm run seed:configurators`, or
// paste edited JSON into the admin product form).
// `material` names must match the materials inside the .glb (see `node scripts/inspect-models.js`).

const BEAD_COLOURS = [
  { id: 'coral', label: 'Coral', color: '#c4553b' },
  { id: 'gold', label: 'Gold', color: '#c9a45c' },
  { id: 'turquoise', label: 'Turquoise', color: '#2fa6a0' },
  { id: 'emerald', label: 'Emerald', color: '#1f7a5c' },
  { id: 'rose', label: 'Rose', color: '#d98a9b' },
  { id: 'midnight', label: 'Midnight', color: '#1f2a44' },
  { id: 'onyx', label: 'Onyx', color: '#1b1714' },
].map((o) => ({ ...o, priceDelta: 0 }));

const ACCENT_COLOURS = [
  { id: 'ivory', label: 'Ivory', color: '#f4ede1' },
  { id: 'gold', label: 'Gold', color: '#c9a45c' },
  { id: 'coral', label: 'Coral', color: '#c4553b' },
  { id: 'turquoise', label: 'Turquoise', color: '#2fa6a0' },
  { id: 'onyx', label: 'Onyx', color: '#1b1714' },
].map((o) => ({ ...o, priceDelta: 0 }));

const METALS = [
  { id: 'silver', label: 'Silver', color: '#cfd0d4', metallic: 1, roughness: 0.2, priceDelta: 0 },
  { id: 'bronze', label: 'Bronze', color: '#a8743b', metallic: 1, roughness: 0.3, priceDelta: 4000 },
  { id: 'gold', label: 'Gold-filled', color: '#d4af37', metallic: 1, roughness: 0.25, priceDelta: 8000 },
  { id: 'rose-gold', label: 'Rose gold', color: '#c58b7a', metallic: 1, roughness: 0.25, priceDelta: 8000 },
];

const part = (id, label, material, options) => ({ id, label, type: 'material', material, options });
const sizes = (id, label, items) => ({
  id,
  label,
  type: 'scale',
  options: items.map(([oid, olabel, scale, priceDelta, isDefault]) => ({ id: oid, label: olabel, scale, priceDelta, ...(isDefault && { isDefault: true }) })),
});
const charm = { id: 'charm', label: 'Gold charm', material: 'Charm', priceDelta: 6000 };

export const configuratorsData = [
  {
    title: 'Ivory Tide Beaded Necklace',
    configurator: {
      model: '/models/beaded-necklace.glb',
      parts: [
        part('beads', 'Bead colour', 'Beads', BEAD_COLOURS),
        part('accent', 'Accent beads', 'Accent', ACCENT_COLOURS),
        part('clasp', 'Clasp metal', 'Metal', METALS),
        sizes('length', 'Length', [['short', 'Short · 16 in', 0.9, 0], ['standard', 'Standard · 18 in', 1, 0, true], ['long', 'Long · 20 in', 1.1, 5000]]),
      ],
      addons: [charm],
    },
  },
  {
    title: 'Woven Seed Bead Friendship Bracelet',
    configurator: {
      model: '/models/beaded-bracelet.glb',
      parts: [
        part('beads', 'Bead colour', 'Beads', BEAD_COLOURS),
        part('accent', 'Accent beads', 'Accent', ACCENT_COLOURS),
        part('clasp', 'Clasp metal', 'Metal', METALS),
        sizes('length', 'Wrist size', [['small', 'Small', 0.92, 0], ['medium', 'Medium', 1, 0, true], ['large', 'Large', 1.08, 0]]),
      ],
      addons: [charm],
    },
  },
  {
    title: 'Turquoise Drop Hooks',
    configurator: {
      model: '/models/beaded-earrings.glb',
      parts: [
        part('beads', 'Bead colour', 'Beads', BEAD_COLOURS),
        part('accent', 'Centre bead', 'Accent', ACCENT_COLOURS),
        part('hooks', 'Ear wire metal', 'Metal', METALS),
        sizes('drop', 'Drop length', [['short', 'Short', 0.85, 0], ['standard', 'Standard', 1, 0, true], ['long', 'Long', 1.15, 3000]]),
      ],
      addons: [],
    },
  },
  {
    title: 'Ivory Shell Anklet',
    configurator: {
      model: '/models/beaded-anklet.glb',
      parts: [
        part('beads', 'Bead colour', 'Beads', BEAD_COLOURS),
        part('accent', 'Accent beads', 'Accent', ACCENT_COLOURS),
        part('clasp', 'Clasp metal', 'Metal', METALS),
        sizes('length', 'Ankle size', [['small', 'Small', 0.93, 0], ['medium', 'Medium', 1, 0, true], ['large', 'Large', 1.07, 0]]),
      ],
      addons: [charm],
    },
  },
];
