import { formatCurrency } from '../../utils/formatCurrency';

export default function PriceTag({ amount, compareAt, className = '' }) {
  return (
    <span className={`font-medium text-accent ${className}`}>
      {formatCurrency(amount)}
      {compareAt && compareAt > amount && (
        <span className="ml-2 text-stone-600 line-through">{formatCurrency(compareAt)}</span>
      )}
    </span>
  );
}
