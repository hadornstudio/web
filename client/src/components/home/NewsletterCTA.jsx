import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function NewsletterCTA() {
  // Wrapped in one extra layer so the whole block reveals as a single grouped
  // fade-up rather than staggering per-child — this is a calm closing CTA, not a showcase.
  const groupRef = useScrollReveal();

  return (
    <section className="bg-ink py-24 text-paper">
      <div ref={groupRef} className="container-page">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl font-display text-3xl">
            Find the piece that's already yours.
          </h2>
          <p className="max-w-md text-stone-300">
            Browse the full collection, or tell us what you have in mind for something made just for you.
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row">
            <Button as={Link} to="/shop">Shop the Collection</Button>
            <Button as={Link} to="/custom-order" variant="secondaryLight">
              Start a Custom Order
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
