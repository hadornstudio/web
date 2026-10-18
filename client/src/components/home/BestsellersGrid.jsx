import { Link } from 'react-router-dom';
import { useFeaturedProducts } from '../../hooks/useProducts';
import ProductCarousel from '../product/ProductCarousel';
import Spinner from '../common/Spinner';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function BestsellersGrid() {
  const { data, isLoading } = useFeaturedProducts();
  const products = data?.data?.products || [];
  const revealRef = useScrollReveal({ y: 16, stagger: 0, deps: [products.length] });

  if (isLoading) return <Spinner />;

  return (
    <section className="bg-cream py-24">
      <div className="container-page">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-600">Loved by Many</p>
            <h2 className="mt-3 font-display text-3xl">Bestsellers</h2>
          </div>
          <Link to="/shop" className="text-sm uppercase tracking-wide text-accent hover:text-accent-dark">
            View All
          </Link>
        </div>
      </div>

      <div ref={revealRef} className="mt-12">
        <ProductCarousel products={products} label="Bestsellers" />
      </div>
    </section>
  );
}
