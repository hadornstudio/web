import { NavLink } from 'react-router-dom';

export default function MobileNav({ open, onClose, links }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="relative flex h-full w-4/5 max-w-xs flex-col gap-6 bg-paper p-8">
        <button type="button" onClick={onClose} className="self-end text-sm uppercase tracking-wide">
          Close
        </button>
        <nav className="flex flex-col gap-5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className="font-display text-2xl text-ink"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
