import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct, useRelatedProducts } from '../hooks/useProducts';
import { useProductReviews } from '../hooks/useReviews';
import { useCartStore } from '../store/useCartStore';
import ProductGallery from '../components/product/ProductGallery';
import VariantSelector from '../components/product/VariantSelector';
import StockStatus from '../components/product/StockStatus';
import PriceTag from '../components/common/PriceTag';
import StarRating from '../components/common/StarRating';
import Button from '../components/common/Button';
import WishlistHeartButton from '../components/common/WishlistHeartButton';
import Spinner from '../components/common/Spinner';
import ProductGrid from '../components/product/ProductGrid';
import ReviewList from '../components/reviews/ReviewList';
import ReviewForm from '../components/reviews/ReviewForm';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data, isLoading } = useProduct(slug);
  const product = data?.data?.product;

  const { data: relatedData } = useRelatedProducts(product?._id);
  const { data: reviewsData } = useProductReviews(product?._id);

  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const [variantId, setVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product?.variants?.length) {
      const firstAvailable = product.variants.find((v) => v.stock > 0) || product.variants[0];
      setVariantId(firstAvailable._id);
    }
  }, [product?._id]);

  if (isLoading) return <Spinner className="py-32" />;
  if (!product) return <div className="container-page py-32 text-center">Product not found.</div>;

  const selectedVariant = product.variants?.find((v) => v._id === variantId);
  const unitPrice = product.basePrice + (selectedVariant?.priceDelta || 0);
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const canAddToCart = product.stockStatus === 'made_to_order' || stock > 0;

  const handleAddToCart = () => {
    addItem({
      productId: product._id,
      variantId: selectedVariant?._id,
      slug: product.slug,
      title: product.title,
      image: product.images[selectedVariant?.imageIndex ?? 0] || product.images[0],
      variantLabel: selectedVariant ? [selectedVariant.color, selectedVariant.material].filter(Boolean).join(' / ') : undefined,
      unitPrice,
      quantity,
    });
    setAdded(true);
    openDrawer();
  };

  return (
    <div className="container-page py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <p className="text-xs uppercase tracking-wide text-stone-600">{product.category?.name}</p>
          <h1 className="mt-2 font-display text-3xl">{product.title}</h1>

          {product.ratingsCount > 0 && (
            <div className="mt-3">
              <StarRating rating={product.ratingsAverage} count={product.ratingsCount} size="lg" />
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <PriceTag amount={unitPrice} className="text-xl" />
            <StockStatus status={product.stockStatus} />
          </div>

          <p className="mt-6 text-stone-600">{product.shortDescription || product.description}</p>

          {product.variants?.length > 0 && (
            <div className="mt-8">
              <VariantSelector
                variants={product.variants}
                basePrice={product.basePrice}
                selectedId={variantId}
                onSelect={(id) => { setVariantId(id); setAdded(false); }}
              />
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-stone-300">
              <button type="button" className="px-3 py-2 text-stone-600 hover:text-accent" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <span className="w-10 text-center text-sm">{quantity}</span>
              <button type="button" className="px-3 py-2 text-stone-600 hover:text-accent" onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>

            <Button onClick={handleAddToCart} disabled={!canAddToCart} className="flex-1">
              {!canAddToCart ? 'Out of Stock' : added ? 'Added ✓' : 'Add to Bag'}
            </Button>

            <WishlistHeartButton productId={product._id} className="p-3" />
          </div>

          {product.materials?.length > 0 && (
            <p className="mt-8 text-sm text-stone-600">
              <span className="text-ink">Materials: </span>{product.materials.join(', ')}
            </p>
          )}

          <div className="mt-10 border-t border-stone-300 pt-8">
            <h2 className="font-display text-xl">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-stone-600">{product.description}</p>
          </div>
        </div>
      </div>

      {relatedData?.data?.products?.length > 0 && (
        <div className="mt-24">
          <h2 className="font-display text-2xl">You May Also Like</h2>
          <div className="mt-8">
            <ProductGrid products={relatedData.data.products} />
          </div>
        </div>
      )}

      <div className="mt-24 max-w-2xl">
        <h2 className="font-display text-2xl">Reviews</h2>
        <div className="mt-6">
          <ReviewList reviews={reviewsData?.data?.reviews} />
        </div>
        <div className="mt-10">
          <h3 className="mb-4 text-sm uppercase tracking-wide text-ink">Write a Review</h3>
          <ReviewForm productId={product._id} />
        </div>
      </div>
    </div>
  );
}
