import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';

export default function DataTable({ columns, data, getRowKey, onRowClick, isLoading, emptyMessage = 'Nothing here yet.' }) {
  if (isLoading) return <Spinner />;
  if (!data?.length) return <EmptyState title={emptyMessage} />;

  const rowKey = getRowKey || ((row) => row._id);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-stone-300 bg-cream text-left text-xs uppercase tracking-wide text-stone-600">
          {columns.map((col) => (
            <th key={col.key} className={`px-4 py-3 font-normal ${col.className || ''}`}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`border-b border-stone-100 ${onRowClick ? 'cursor-pointer hover:bg-cream/50' : ''}`}
          >
            {columns.map((col) => (
              <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
