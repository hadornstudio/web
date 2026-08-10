export default function Input({ label, error, className = '', id, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-1.5 block text-sm text-stone-600">{label}</span>}
      <input
        id={id}
        className={`w-full border border-stone-300 bg-paper px-4 py-2.5 text-ink placeholder:text-stone-600/60 focus:border-accent focus:outline-none ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-error">{error}</span>}
    </label>
  );
}
