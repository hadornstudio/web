import { useWishlist } from '../../hooks/useWishlist';
import ProductGrid from '../product/ProductGrid';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';

export default function WishlistGrid() {
  const { wishlist, isLoading } = useWishlist();

  if (isLoading) return <Spinner />;
  if (!wishlist.length) {
    return <EmptyState title="Your wishlist is empty" description="Save pieces you love to find them here later." />;
  }

  return <ProductGrid products={wishlist} />;
}
