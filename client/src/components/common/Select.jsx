export default function Select({ label, className = '', children, id, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-1.5 block text-sm text-stone-600">{label}</span>}
      <select
        id={id}
        className={`w-full border border-stone-300 bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
