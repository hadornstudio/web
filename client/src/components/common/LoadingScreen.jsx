import BrandSvg from '../brand/BrandSvg';

// The site's one loading state: the Hadorn mark assembling over a thin progress line. Same markup as the
// first-load splash in index.html, so the very first screen and every later wait look identical.
//   fullscreen — covers the viewport (route/chunk loads that replace the whole page)
//   otherwise  — fills its parent's content area (min-h-[60vh] by default)
export default function LoadingScreen({ fullscreen = false, dark = false, className = '' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`loader-screen ${fullscreen ? 'loader-fixed' : 'min-h-[60vh]'} ${dark ? '!bg-night !text-ivory' : ''} ${className}`}
    >
      <div className="loader-stack">
        <BrandSvg name="mark" className="loader-mark" />
        <BrandSvg name="wordmark" className="loader-word" />
        <span className="loader-bar" aria-hidden="true"><i /></span>
      </div>
    </div>
  );
}
