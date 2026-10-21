import { loadMask, rowExtent } from './silhouette.mjs';
const dir = '/Users/user/Desktop/Hadorn/capture-work/masks';
for (const [name, file] of [['front', 'm6'], ['back', 'm2'], ['side', 'm4'], ['front-long-train', 'm5'], ['three-quarter', 'm3']]) {
  const m = await loadMask(`${dir}/${file}.png`);
  const H = m.bottom - m.top;
  const rows = [0, .03, .06, .1, .15, .2, .25, .3, .35, .4, .5, .6, .7, .8, .9, 1].map((t) => {
    const y = Math.min(m.bottom, Math.round(m.top + t * H));
    const e = rowExtent(m.runs, y);
    return `${t.toFixed(2)}:${m.runs[y].length}r w${e ? e[1] - e[0] : 0}`;
  });
  console.log(`${name.padEnd(17)} top ${m.top} bottom ${m.bottom} (h ${H})  ${rows.join('  ')}`);
}
