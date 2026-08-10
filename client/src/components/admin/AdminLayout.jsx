import { useRef } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../../hooks/useAuth';
import { gsap, Flip, EASE, DURATION, prefersReducedMotion } from '../../lib/motion/gsapConfig';
import ToastContainer from './ToastContainer';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/promos', label: 'Promos' },
  { to: '/admin/ads', label: 'Ad Campaigns' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/gallery', label: 'Gallery' },
  { to: '/admin/gallery-likes', label: 'Interested Customers' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
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
    <div className="flex h-screen bg-paper text-ink">
      <aside className="flex w-56 shrink-0 flex-col border-r border-stone-300 bg-cream">
        <Link to="/admin" className="flex items-center gap-2 px-6 py-5">
          <img src="/logo-mark.png" alt="" className="h-6 w-6" />
          <span className="font-display text-base">HADORN</span>
        </Link>
        <nav ref={navRef} className="relative flex flex-1 flex-col gap-1 px-3">
          <div className="active-indicator absolute left-0 w-0.5 bg-accent" />
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-3 py-2 text-sm uppercase tracking-wide transition-colors duration-200 ${
                  isActive ? 'text-accent' : 'text-stone-600 hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-300 px-8">
          <span className="text-xs uppercase tracking-wide text-stone-600">Admin</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-stone-600">{user?.name}</span>
            <Link to="/" className="text-stone-600 hover:text-accent">View Store</Link>
            <button type="button" onClick={logout} className="text-stone-600 hover:text-error">
              Log Out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
