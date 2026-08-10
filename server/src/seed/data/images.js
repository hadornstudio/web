// Curated free-license stock photography (Unsplash), hotlinked for Phase 1 seed data.
// Real product photography will replace these via the admin image upload in a later phase.
const u = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

export const necklaceImages = [
  u('1646070107254-3713cec279c1'),
  u('1633459653250-1883991e68c1'),
  u('1609446154807-d56805f0e007'),
  u('1719862056552-b9de4f843beb'),
  u('1629481995102-ff98d306dd8a'),
  u('1609428126821-b26911b6d662'),
  u('1560696509-660210e603a7'),
  u('1560847133-e6f64dc352ea'),
  u('1601387603639-387c75bdcb0d'),
  u('1574362098421-38623a3466b5'),
  u('1618164790892-d0a7c2b1438d'),
  u('1606760227091-3dd870d97f1d'),
  u('1611107683227-e9060eccd846'),
];

export const braceletImages = [
  u('1632670549453-7a3dfac254a2'),
  u('1656437342100-6e99ab500845'),
  u('1629890731335-52295b8be1d9'),
  u('1637808248242-57a6265593ed'),
  u('1703034390461-0b978d9bd21d'),
  u('1636520326725-ef3fe2bf0557'),
  u('1761222101900-9c9e34fac2ce'),
  u('1632670549449-195cf8584a46'),
  u('1766560360611-ea9da518e5e0'),
  u('1766560359399-b8ac22d0e2c4'),
  u('1608042314453-ae338d80c427'),
];

export const earringImages = [
  u('1573227890085-12ab5d68a170'),
  u('1706076876111-28bf14ec6169'),
  u('1679590988891-2357406aca80'),
  u('1573227895118-8f8fa1172a09'),
  u('1632974754836-5aec43c7e3de'),
  u('1573227895226-86880bc6ce44'),
  u('1747451050504-3b268d62c3da'),
  u('1762762905728-955d8ec09cbb'),
  u('1630233888150-e2e0c6aac3d9'),
];

// Anklets share the beaded-chain aesthetic of bracelets — reusing that pool as stand-ins
// until real product photography is uploaded via the admin panel.
export const ankletImages = [
  u('1637808248242-57a6265593ed'),
  u('1636520326725-ef3fe2bf0557'),
  u('1629890731335-52295b8be1d9'),
  u('1766560360611-ea9da518e5e0'),
  u('1608042314453-ae338d80c427'),
  u('1632670549449-195cf8584a46'),
];

export const craftImages = [
  u('1522065893269-6fd20f6d7438'),
  u('1608112169461-48616144c894'),
  u('1626252685663-64c6bf60afb1'),
  u('1444069788560-6ae1deb4c0d4'),
  u('1659032882718-3e54e7da86ab'),
  u('1659032882703-f1e4983fe1b8'),
  u('1626252685643-8a305c55e98d'),
  u('1715374033196-0ff662284a7e'),
];

export const heroImages = [
  u('1561828995-aa79a2db86dd', 1920),
  u('1611170947204-5ab96c3e37a1', 1920),
  u('1631050165122-626a1377fbce', 1920),
  u('1697713465161-d872b22723a2', 1920),
];

export const testimonialAvatars = [
  u('1580489944761-15a19d654956', 200),
  u('1489278353717-f64c6ee8a4d2', 200),
  u('1506863530036-1efeddceb993', 200),
  u('1562337404-3044c84ac061', 200),
  u('1611695434369-a8f5d76ceb7b', 200),
  u('1623717217554-72ca676de535', 200),
];
