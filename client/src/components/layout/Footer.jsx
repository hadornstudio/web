import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-stone-300 bg-cream">
      <div className="container-page grid grid-cols-1 gap-12 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="" className="h-7 w-7" />
            <p className="font-display text-xl text-ink">HADORN</p>
          </div>
          <p className="mt-4 max-w-xs text-sm text-stone-600">
            Handcrafted beading and jewelry, strung one bead at a time.
          </p>
        </div>

        <div>
          <p className="mb-4 text-sm uppercase tracking-wide text-ink">Shop</p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li><Link to="/shop/necklaces" className="hover:text-accent">Necklaces</Link></li>
            <li><Link to="/shop/bracelets" className="hover:text-accent">Bracelets</Link></li>
            <li><Link to="/shop/earrings" className="hover:text-accent">Earrings</Link></li>
            <li><Link to="/shop/anklets" className="hover:text-accent">Anklets</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm uppercase tracking-wide text-ink">Hadorn</p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li><Link to="/#craft" className="hover:text-accent">Our Craft</Link></li>
            <li><Link to="/gallery" className="hover:text-accent">Gallery</Link></li>
            <li><Link to="/custom-order" className="hover:text-accent">Custom Orders</Link></li>
            <li><Link to="/account" className="hover:text-accent">Account</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm uppercase tracking-wide text-ink">Stay in Touch</p>
          <p className="text-sm text-stone-600">Occasional notes on new collections. No noise.</p>
        </div>
      </div>

      <div className="container-page flex flex-col gap-2 border-t border-stone-300 py-6 text-xs text-stone-600 md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} Hadorn. All rights reserved.</span>
        <span>Made by hand, always.</span>
      </div>
    </footer>
  );
}
