// Right-sized, modern-format versions of remote images. Unsplash and Cloudinary resize on the fly;
// any other host (or a data:/blob: URL) is returned unchanged.
export function sizedImage(url, width) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    if (u.hostname === 'images.unsplash.com') {
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '70');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    }
    if (u.hostname === 'res.cloudinary.com' && u.pathname.includes('/image/upload/') && !/\/upload\/[^/]*(w_|f_)/.test(u.pathname)) {
      u.pathname = u.pathname.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`);
      return u.toString();
    }
  } catch {
    // not an absolute URL: leave it alone
  }
  return url;
}

// Spread onto <img>: src + srcSet + sizes. `sizes` describes the slot the image fills at each breakpoint.
export function responsiveImage(url, sizes, widths = [400, 800, 1200]) {
  const src = sizedImage(url, widths[Math.min(1, widths.length - 1)]);
  if (src === url) return { src: url };
  return { src, srcSet: widths.map((w) => `${sizedImage(url, w)} ${w}w`).join(', '), sizes };
}
