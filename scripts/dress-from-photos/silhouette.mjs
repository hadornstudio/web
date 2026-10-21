// Row-by-row measurements of a subject mask (white = subject): extents and the separate horizontal runs in each row.
import sharp from 'sharp';

export async function loadMask(path) {
  const { data, info } = await sharp(path).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const on = (x, y) => data[y * width + x] > 127;
  // runs per row: [[x0, x1], ...] (inclusive), ignoring specks shorter than 3 px
  const runs = [];
  let top = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    const row = [];
    let start = -1;
    for (let x = 0; x <= width; x++) {
      const v = x < width && on(x, y);
      if (v && start < 0) start = x;
      if (!v && start >= 0) {
        if (x - 1 - start >= 2) row.push([start, x - 1]);
        start = -1;
      }
    }
    runs.push(row);
    if (row.length) {
      if (top < 0) top = y;
      bottom = y;
    }
  }
  return { width, height, runs, top, bottom, on };
}

export const rowExtent = (runs, y) => (runs[y].length ? [runs[y][0][0], runs[y][runs[y].length - 1][1]] : null);
