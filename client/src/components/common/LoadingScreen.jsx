import BrandSvg from '../brand/BrandSvg';

// The site's one loading state: the dark brown screen with the gold Hadorn mark assembling and the wordmark
// rising — the same look as the first-load splash in index.html and the home-page logo intro.
//   fullscreen — covers the viewport (route/chunk loads that replace the whole page)
//   otherwise  — fills its parent's content area (min-h-[60vh] by default)
export default function LoadingScreen({ fullscreen = false, className = '' }) {
  return (
    <div role="status" aria-label="Loading" className={`loader-screen ${fullscreen ? 'loader-fixed' : 'min-h-[60vh]'} ${className}`}>
      <div className="loader-stack">
        <BrandSvg name="mark" className="loader-mark" />
        <BrandSvg name="studio" className="loader-word" />
      </div>
    </div>
  );
}
