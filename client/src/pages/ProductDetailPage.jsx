import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useProduct, useRelatedProducts } from '../hooks/useProducts';
import { useProductReviews } from '../hooks/useReviews';
import { usePageMeta } from '../hooks/usePageMeta';
import { useCartStore } from '../store/useCartStore';
import ProductGallery from '../components/product/ProductGallery';
import ProductViewer3D from '../components/product3d/ProductViewer3D';
import { webglAvailable } from '../utils/webgl';
import Configurator from '../components/product3d/Configurator';
import {
  configKey,
  selectionFromParams,
  selectionPriceDelta,
  selectionSummary,
  selectionToParams,
} from '../utils/configurator';
import VariantSelector from '../components/product/VariantSelector';
import StockStatus from '../components/product/StockStatus';
import PriceTag from '../components/common/PriceTag';
import StarRating from '../components/common/StarRating';
import Button from '../components/common/Button';
import WishlistHeartButton from '../components/common/WishlistHeartButton';
import LocalShippingEstimate from '../components/product/LocalShippingEstimate';
import Spinner from '../components/common/Spinner';
import ProductCarousel from '../components/product/ProductCarousel';
import ReviewList from '../components/reviews/ReviewList';
import ReviewForm from '../components/reviews/ReviewForm';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data, isLoading } = useProduct(slug);
  const product = data?.data?.product;

  const { data: relatedData } = useRelatedProducts(product?._id);
  const { data: reviewsData } = useProductReviews(product?._id);
  usePageMeta({ title: product?.title, description: product?.shortDescription || product?.description });

  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const [variantId, setVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const config = product?.configurator?.enabled ? product.configurator : null;
  const [selection, setSelection] = useState(null);
  const [viewMode, setViewMode] = useState('3d');
  const [viewerFailed, setViewerFailed] = useState(false);
  const [canView3D] = useState(webglAvailable);
  const viewerRef = useRef(null);
  const handleViewerUnavailable = useCallback(() => setViewerFailed(true), []);

  // Restore a shared configuration from the URL, else start from the defaults.
  useEffect(() => {
    setSelection(config ? selectionFromParams(config, searchParams) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  useEffect(() => {
    if (config && selection) setSearchParams(selectionToParams(config, selection, searchParams), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  useEffect(() => {
    if (product?.variants?.length) {
      const firstAvailable = product.variants.find((v) => v.stock > 0) || product.variants[0];
      setVariantId(firstAvailable._id);
    }
  }, [product?._id]);

  if (isLoading) return <Spinner className="min-h-[100vh] items-start pt-32" />;
  if (!product) return <div className="container-page py-32 text-center">Product not found.</div>;

  const selectedVariant = product.variants?.find((v) => v._id === variantId);
  const configDelta = config && selection ? selectionPriceDelta(config, selection) : 0;
  const unitPrice = product.basePrice + (selectedVariant?.priceDelta || 0) + configDelta;
  const show3D = Boolean(config && selection && canView3D && !viewerFailed);
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const canAddToCart = product.stockStatus === 'made_to_order' || stock > 0;

  const handleAddToCart = async () => {
    let image = product.images[selectedVariant?.imageIndex ?? 0] || product.images[0];
    let configFields = {};
    if (config && selection) {
      // Thumbnail of the configured 3D model for the bag; the order itself stores the choices.
      const snapshot = show3D
        ? await Promise.race([viewerRef.current?.snapshot(), new Promise((resolve) => setTimeout(() => resolve(null), 2500))])
        : null;
      if (snapshot) image = snapshot;
      configFields = {
        configKey: configKey(config, selection),
        options: selection.options,
        addons: selection.addons,
        configSummary: selectionSummary(config, selection),
      };
    }
    addItem({
      productId: product._id,
      variantId: selectedVariant?._id,
      slug: product.slug,
      title: product.title,
      image,
      variantLabel: !config && selectedVariant ? [selectedVariant.color, selectedVariant.material].filter(Boolean).join(' / ') : undefined,
      unitPrice,
      quantity,
      ...configFields,
    });
    setAdded(true);
    openDrawer();
  };

  return (
    <>
    <div className="container-page pt-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {show3D ? (
          <div className="sticky top-20 z-10 self-start bg-paper pb-2 md:top-24">
            <div className="mb-3 flex gap-5 text-xs uppercase tracking-[0.2em]">
              {[['3d', '3D view'], ['photos', 'Photos']].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`border-b pb-1 transition-colors ${viewMode === mode ? 'border-accent text-accent' : 'border-transparent text-stone-600 hover:text-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={viewMode === '3d' ? '' : 'hidden'}>
              <ProductViewer3D ref={viewerRef} product={product} selection={selection} onUnavailable={handleViewerUnavailable} />
            </div>
            {viewMode === 'photos' && <ProductGallery images={product.images} title={product.title} />}
          </div>
        ) : (
          <ProductGallery images={product.images} title={product.title} />
        )}

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

          {!config && product.variants?.length > 0 && (
            <div className="mt-8">
              <VariantSelector
                variants={product.variants}
                basePrice={product.basePrice}
                selectedId={variantId}
                onSelect={(id) => { setVariantId(id); setAdded(false); }}
              />
            </div>
          )}

          {config && selection && <Configurator config={config} selection={selection} onChange={setSelection} />}

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

          <LocalShippingEstimate />

          <div className="mt-10 border-t border-stone-300 pt-8">
            <h2 className="font-display text-xl">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-stone-600">{product.description}</p>
          </div>
        </div>
      </div>

    </div>

    {relatedData?.data?.products?.length > 0 && (
      <section className="mt-24">
        <div className="container-page">
          <h2 className="font-display text-2xl">You May Also Like</h2>
        </div>
        <div className="mt-8">
          <ProductCarousel products={relatedData.data.products} label="You may also like" />
        </div>
      </section>
    )}

    <div className="container-page pb-16">
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
    </>
  );
}
