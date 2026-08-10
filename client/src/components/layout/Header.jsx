import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import MobileNav from './MobileNav';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop/necklaces', label: 'Necklaces' },
  { to: '/shop/bracelets', label: 'Bracelets' },
  { to: '/shop/earrings', label: 'Earrings' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/custom-order', label: 'Custom' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openDrawer = useCartStore((s) => s.openDrawer);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-300 bg-paper/95 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between">
        <button
          type="button"
          className="text-ink md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <path d="M0 1h22M0 8h22M0 15h22" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-2.5 text-ink">
          <img src="/logo-mark.png" alt="" className="h-8 w-8" />
          <span className="font-display text-xl tracking-wide">HADORN</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm uppercase tracking-wide transition-colors hover:text-accent ${
                  isActive ? 'text-accent' : 'text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className="hidden text-sm uppercase tracking-wide text-ink hover:text-accent md:inline"
          >
            {isAuthenticated ? 'Account' : 'Login'}
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            className="relative text-ink hover:text-accent"
            aria-label="Open cart"
          >
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
              <path
                d="M4 7V5a5 5 0 0110 0v2M1 7h17l-1.2 13.2a1 1 0 01-1 .8H3.2a1 1 0 01-1-.8L1 7z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-paper">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} links={NAV_LINKS} />
    </header>
  );
}
