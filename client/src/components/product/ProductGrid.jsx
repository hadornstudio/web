import ProductCard from './ProductCard';
import EmptyState from '../common/EmptyState';

export default function ProductGrid({ products }) {
  if (!products?.length) {
    return <EmptyState title="No pieces found" description="Try adjusting your filters or search." />;
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
