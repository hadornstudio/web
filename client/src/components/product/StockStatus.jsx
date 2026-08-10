import Badge from '../common/Badge';

const CONFIG = {
  in_stock: null,
  low_stock: { tone: 'accent', label: 'Low Stock' },
  out_of_stock: { tone: 'error', label: 'Out of Stock' },
  made_to_order: { tone: 'neutral', label: 'Made to Order' },
};

export default function StockStatus({ status }) {
  const config = CONFIG[status];
  if (!config) return null;
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
