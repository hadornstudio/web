import { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../../hooks/useAuth';
import { gsap, Flip, EASE, DURATION, prefersReducedMotion } from '../../lib/motion/gsapConfig';

const LINKS = [
  { to: '/account', label: 'For You', end: true },
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/wishlist', label: 'Wishlist' },
];

export default function AccountSidebar() {
  const { logout, user } = useAuth();
  const navRef = useRef(null);
  const location = useLocation();

  useGSAP(
    () => {
      if (!navRef.current) return;
      const activeLink = navRef.current.querySelector('[aria-current="page"]');
      const indicator = navRef.current.querySelector('.active-indicator');
      if (!activeLink || !indicator) return;

      const target = { y: activeLink.offsetTop, height: activeLink.offsetHeight };

      if (prefersReducedMotion()) {
        gsap.set(indicator, target);
        return;
      }

      const state = Flip.getState(indicator);
      gsap.set(indicator, target);
      Flip.from(state, { duration: DURATION.fast, ease: EASE.hover });
    },
    { dependencies: [location.pathname], scope: navRef }
  );

  return (
    <aside className="w-full shrink-0 md:w-48">
      <p className="mb-1 text-sm text-stone-600">Signed in as</p>
      <p className="mb-6 text-sm text-ink">{user?.name}</p>
      <nav ref={navRef} className="relative flex flex-col gap-3 pl-3">
        <div className="active-indicator absolute left-0 w-0.5 bg-accent" />
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `text-sm uppercase tracking-wide transition-all duration-200 hover:translate-x-0.5 ${isActive ? 'text-accent' : 'text-stone-600 hover:text-ink'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={logout}
          className="text-left text-sm uppercase tracking-wide text-stone-600 transition-all duration-200 hover:translate-x-0.5 hover:text-error"
        >
          Log Out
        </button>
      </nav>
    </aside>
  );
}
