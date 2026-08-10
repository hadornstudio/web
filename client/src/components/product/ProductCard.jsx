import { Link } from 'react-router-dom';
import PriceTag from '../common/PriceTag';
import StockStatus from './StockStatus';
import StarRating from '../common/StarRating';
import WishlistHeartButton from '../common/WishlistHeartButton';

export default function ProductCard({ product }) {
  const { min, max } = product.effectivePriceRange || { min: product.basePrice, max: product.basePrice };
  const secondImage = product.images?.[1];

  return (
    <Link to={`/product/${product.slug}`} className="product-card group block">
      <div className="relative aspect-square overflow-hidden bg-cream">
        <img
          src={product.images?.[0]}
          alt={product.title}
          className="h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        {secondImage && (
          <img
            src={secondImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        {product.stockStatus !== 'in_stock' && (
          <div className="absolute left-3 top-3">
            <StockStatus status={product.stockStatus} />
          </div>
        )}
        <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <WishlistHeartButton productId={product._id} className="bg-paper/90" />
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm text-ink">{product.title}</h3>
          {product.ratingsCount > 0 && (
            <div className="mt-1">
              <StarRating rating={product.ratingsAverage} count={product.ratingsCount} />
            </div>
          )}
        </div>
        <PriceTag amount={min} className="shrink-0 text-sm" />
      </div>
      {min !== max && <p className="mt-0.5 text-xs text-stone-600">to {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(max)}</p>}
    </Link>
  );
}
