import InfiniteCarousel from '../common/InfiniteCarousel';
import ProductCard from './ProductCard';

// Endless swipeable row of product cards (about 1.6 cards on a phone, 3 on tablets, 4 on desktops).
export default function ProductCarousel({ products, label, ...motion }) {
  return (
    <InfiniteCarousel
      label={label}
      {...motion}
      items={products}
      gapClassName="gap-4 md:gap-6"
      itemClassName="w-[62vw] sm:w-[38vw] md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]"
      renderItem={(product) => <ProductCard product={product} />}
    />
  );
}
