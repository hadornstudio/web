const VARIANTS = {
  primary: 'bg-accent text-paper hover:bg-accent-dark',
  secondary: 'bg-transparent border border-ink text-ink hover:bg-ink hover:text-paper',
  secondaryLight: 'bg-transparent border border-paper text-paper hover:bg-paper hover:text-ink',
  ghost: 'bg-transparent text-ink hover:text-accent',
};

export default function Button({ variant = 'primary', className = '', as: Component = 'button', ...props }) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm tracking-wide uppercase transition-[color,background-color,border-color,transform,box-shadow] duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
