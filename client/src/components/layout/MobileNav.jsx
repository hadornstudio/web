import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { gsap, prefersReducedMotion } from '../../lib/motion/gsapConfig';
import { getLenis } from '../../lib/lenisManager';
import BrandSvg from '../brand/BrandSvg';

// Full-screen menu in the brand's dark brown + gold. Opens with a circle that grows out of the hamburger button
// (the icon morphs into an X as it goes), the links rise out of masks one after another, and it all plays
// back in reverse on close. The component stays mounted while the close animation runs.
const BAR = 'absolute left-0 h-[1.5px] w-full bg-ivory';

export default function MobileNav({ open, onClose, links, account }) {
  const [mounted, setMounted] = useState(open);
  const { pathname } = useLocation();
  const rootRef = useRef(null);
  const tlRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Page behind the menu must not scroll while it is up.
  useEffect(() => {
    if (!mounted) return undefined;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = 'hidden';
    getLenis()?.stop();
    return () => {
      html.style.overflow = previous;
      getLenis()?.start();
    };
  }, [mounted]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Opening: runs before paint so the menu never flashes fully visible.
  useLayoutEffect(() => {
    if (!mounted || !open) return undefined;
    const root = rootRef.current;
    const q = (s) => root.querySelectorAll(s);
    const button = document.querySelector('[data-menu-button]');
    const rect = button?.getBoundingClientRect();
    const ox = rect ? rect.left + rect.width / 2 : 36;
    const oy = rect ? rect.top + rect.height / 2 : 40;
    const radius = Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy)) + 40;
    root.dataset.origin = `${ox},${oy},${radius}`;

    if (prefersReducedMotion()) {
      gsap.set(root, { clipPath: 'none' });
      gsap.set(q('[data-bar-top]'), { y: 7, rotation: 45 });
      gsap.set(q('[data-bar-bottom]'), { y: -7, rotation: -45 });
      gsap.set(q('[data-bar-mid]'), { scaleX: 0 });
      closeBtnRef.current?.focus();
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(root, { clipPath: `circle(0px at ${ox}px ${oy}px)` });
      gsap.set(q('[data-link-text]'), { yPercent: 115, rotate: 5 });
      gsap.set(q('[data-link-num]'), { opacity: 0, x: -14 });
      gsap.set(q('[data-link-rule]'), { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(q('[data-menu-foot]'), { opacity: 0, y: 18 });
      gsap.set(q('[data-menu-logo]'), { opacity: 0 });
      tlRef.current?.kill();
      tlRef.current = gsap
        .timeline({ onComplete: () => closeBtnRef.current?.focus() })
        .to(root, { clipPath: `circle(${radius}px at ${ox}px ${oy}px)`, duration: 0.85, ease: 'power3.inOut' }, 0)
        .to(q('[data-bar-mid]'), { scaleX: 0, duration: 0.25, ease: 'power2.in' }, 0.05)
        .to(q('[data-bar-top]'), { y: 7, rotation: 45, duration: 0.5, ease: 'power3.out' }, 0.1)
        .to(q('[data-bar-bottom]'), { y: -7, rotation: -45, duration: 0.5, ease: 'power3.out' }, 0.1)
        .to(q('[data-menu-logo]'), { opacity: 1, duration: 0.5 }, 0.45)
        .to(q('[data-link-text]'), { yPercent: 0, rotate: 0, duration: 0.8, ease: 'power4.out', stagger: 0.07 }, 0.4)
        .to(q('[data-link-num]'), { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', stagger: 0.07 }, 0.5)
        .to(q('[data-link-rule]'), { scaleX: 1, duration: 0.9, ease: 'power3.inOut', stagger: 0.07 }, 0.45)
        .to(q('[data-menu-foot]'), { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, 0.95);
    }, root);
    return () => ctx.revert();
  }, [mounted, open]);

  // Closing: links lift away, the X folds back into a hamburger, the circle shrinks into the button.
  useEffect(() => {
    if (open || !mounted) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    const done = () => {
      setMounted(false);
      document.querySelector('[data-menu-button]')?.focus({ preventScroll: true });
    };
    if (prefersReducedMotion()) {
      done();
      return undefined;
    }
    const q = (s) => root.querySelectorAll(s);
    const [ox, oy] = (root.dataset.origin || '36,40').split(',').map(Number);
    tlRef.current?.kill();
    tlRef.current = gsap
      .timeline({ onComplete: done })
      .to(q('[data-menu-foot]'), { opacity: 0, y: 12, duration: 0.25, ease: 'power2.in' }, 0)
      .to(q('[data-link-text]'), { yPercent: -115, rotate: -4, duration: 0.45, ease: 'power3.in', stagger: { each: 0.04, from: 'end' } }, 0)
      .to(q('[data-link-num]'), { opacity: 0, duration: 0.25 }, 0)
      .to(q('[data-link-rule]'), { scaleX: 0, transformOrigin: 'right center', duration: 0.4, ease: 'power3.in' }, 0)
      .to(q('[data-menu-logo]'), { opacity: 0, duration: 0.25 }, 0)
      .to(q('[data-bar-top]'), { y: 0, rotation: 0, duration: 0.4, ease: 'power3.inOut' }, 0.2)
      .to(q('[data-bar-bottom]'), { y: 0, rotation: 0, duration: 0.4, ease: 'power3.inOut' }, 0.2)
      .to(q('[data-bar-mid]'), { scaleX: 1, duration: 0.3, ease: 'power2.out' }, 0.35)
      .to(root, { clipPath: `circle(0px at ${ox}px ${oy}px)`, duration: 0.6, ease: 'power3.inOut' }, 0.3);
    return undefined;
  }, [open, mounted]);

  useEffect(() => () => tlRef.current?.kill(), []);

  if (!mounted) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-50 overflow-y-auto bg-night text-ivory xl:hidden"
      style={{ clipPath: 'circle(0px at 36px 40px)' }}
    >
      {/* Top bar: same geometry as the site header, so the X sits exactly where the hamburger was. */}
      <div className="container-page flex h-20 items-center justify-between">
        <button ref={closeBtnRef} type="button" onClick={onClose} aria-label="Close menu" className="relative h-4 w-[22px] shrink-0">
          <span data-bar-top className={`${BAR} top-0`} />
          <span data-bar-mid className={`${BAR} top-[7px]`} />
          <span data-bar-bottom className={`${BAR} top-[14px]`} />
        </button>
        <Link to="/" onClick={onClose} aria-label="Hadorn Studio — home" data-menu-logo className="flex items-center gap-3 text-gold">
          <BrandSvg name="mark" className="w-8" />
          <BrandSvg name="wordmark" className="w-20" />
        </Link>
        <span className="w-[22px]" aria-hidden="true" />
      </div>

      <nav aria-label="Main" className="container-page pb-6 pt-8">
        <ul>
          {links.map((link, i) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-baseline gap-5 py-4 transition-colors duration-300 ${isActive ? 'text-gold' : 'text-ivory hover:text-gold'}`
                }
              >
                <span data-link-num className="w-7 font-studio text-xs font-light tracking-[0.25em] text-gold/80">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
                  <span data-link-text className="block origin-left font-display text-[2.6rem] leading-[1.05] transition-transform duration-300 group-hover:translate-x-2">
                    {link.label}
                  </span>
                </span>
                {pathname === link.to && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />}
              </NavLink>
              <div data-link-rule className="h-px w-full bg-ivory/15" />
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page pb-12 pt-4 font-studio">
        <Link
          data-menu-foot
          to={account.to}
          onClick={onClose}
          className="inline-block border border-ivory/50 px-7 py-3 text-xs uppercase tracking-[0.25em] text-ivory transition-colors duration-300 hover:bg-ivory hover:text-night"
        >
          {account.label}
        </Link>
        <p data-menu-foot className="mt-8 text-[11px] font-light uppercase tracking-[0.3em] text-ivory/50">
          Handcrafted beadwork · Attire · Accessories
        </p>
      </div>
    </div>
  );
}
