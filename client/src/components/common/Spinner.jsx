import BrandSvg from '../brand/BrandSvg';

// Small inline loading state (lists, buttons' neighbours, admin tables): the same animated Hadorn mark as the
// full loading screen, without the wordmark. Page-level waits use <LoadingScreen /> instead.
export default function Spinner({ className = '' }) {
  return (
    <div role="status" aria-label="Loading" className={`loader-compact flex items-center justify-center py-12 ${className}`}>
      <BrandSvg name="mark" className="loader-mark" />
    </div>
  );
}
