import { Link } from 'react-router-dom';
import { useAdsByPlacement } from '../../hooks/useAds';

// One ad campaign rendered wherever this is embedded — admin controls which ad shows
// here by setting its `placement` field; this component just picks the top-priority
// live one for that slot (or renders nothing if none is configured).
export default function AdSlot({ placement, className = '' }) {
  const { data: ads } = useAdsByPlacement(placement);
  const ad = ads?.[0];

  if (!ad) return null;

  const couponCode = ad.promo?.coupon?.code;
  const caption = ad.promo?.description || ad.title;

  const media = ad.mediaType === 'video' ? (
    <video src={ad.mediaUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
  ) : (
    <img src={ad.mediaUrl} alt={ad.title} className="h-full w-full object-cover" />
  );

  const overlay = (
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-ink/10 to-transparent p-6 text-paper md:p-10">
      <p className="text-xs uppercase tracking-[0.2em] text-paper/80">{ad.promo ? 'Promotion' : 'Featured'}</p>
      <h3 className="mt-2 max-w-lg font-display text-2xl md:text-3xl">{ad.title}</h3>
      {caption && caption !== ad.title && <p className="mt-2 max-w-md text-sm text-paper/90">{caption}</p>}
      {couponCode && (
        <p className="mt-3 inline-block w-fit border border-paper/60 px-3 py-1.5 text-xs uppercase tracking-wide">
          Use code <span className="font-medium">{couponCode}</span> at checkout
        </p>
      )}
    </div>
  );

  const content = (
    <div className={`relative aspect-[21/9] w-full overflow-hidden bg-cream ${className}`}>
      {media}
      {overlay}
    </div>
  );

  if (ad.linkType === 'product' && ad.product?.slug) {
    return <Link to={`/product/${ad.product.slug}`} className="block">{content}</Link>;
  }
  if (ad.linkType === 'category' && ad.category?.slug) {
    return <Link to={`/shop/${ad.category.slug}`} className="block">{content}</Link>;
  }
  if (ad.linkType === 'promo') {
    return <Link to="/shop" className="block">{content}</Link>;
  }
  if (ad.linkType === 'url' && ad.url) {
    return (
      <a href={ad.url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}
