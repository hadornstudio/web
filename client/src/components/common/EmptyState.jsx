export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h3 className="text-2xl">{title}</h3>
      {description && <p className="max-w-md text-stone-600">{description}</p>}
      {action}
    </div>
  );
}
