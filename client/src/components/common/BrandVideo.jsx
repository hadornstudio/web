import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/motion/gsapConfig';

// Muted, silent background film that fills its parent. Plays while on screen (and the tab is visible), pauses when it
// isn't, and never downloads the clip for visitors who prefer reduced motion or have data saver on: they get the poster.
//   src / poster  files under /video (see client/public/video)
//   loop          loop forever (the orbit); otherwise it plays once and holds its last frame (the bead films end on a good image)
//   delay         ms before it starts, so a page's own animation can settle first
export default function BrandVideo({ src, poster, loop = false, delay = 0, className = '', children }) {
  const ref = useRef(null);
  const [allowed] = useState(() => !prefersReducedMotion() && !navigator.connection?.saveData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!allowed || !video) return undefined;
    let visible = true;
    let started = false;
    let timer = 0;
    const sync = () => {
      if (started && visible && !document.hidden) video.play().catch(() => {}); // autoplay can be refused on some phones: poster stays
      else video.pause();
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.15 });
    io.observe(video);
    document.addEventListener('visibilitychange', sync);
    timer = window.setTimeout(() => { started = true; video.preload = 'auto'; sync(); }, delay); // play() itself starts the download
    return () => { clearTimeout(timer); io.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [allowed, delay]);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-night ${className}`}>
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {allowed && (
        <video
          ref={ref}
          muted
          playsInline
          loop={loop}
          preload="none"
          poster={poster}
          onPlaying={() => setReady(true)}
          aria-hidden="true"
          tabIndex={-1}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      {children}
    </div>
  );
}
