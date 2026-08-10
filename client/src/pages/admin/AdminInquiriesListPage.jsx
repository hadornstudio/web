import { useAdminInquiries, useUpdateInquiryStatus } from '../../hooks/useInquiries';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from '../../store/useToastStore';

const STATUSES = ['new', 'contacted', 'closed'];
const STATUS_TONE = { new: 'accent', contacted: 'neutral', closed: 'success' };

export default function AdminInquiriesListPage() {
  const { data: inquiries, isLoading } = useAdminInquiries();
  const updateStatus = useUpdateInquiryStatus();

  const handleStatusChange = (inquiry, status) => {
    updateStatus.mutate(
      { id: inquiry._id, status },
      { onSuccess: () => toast.success('Inquiry updated'), onError: () => toast.error('Could not update inquiry') }
    );
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Custom Order Inquiries</h1>

      {isLoading ? (
        <Spinner />
      ) : !inquiries?.length ? (
        <EmptyState title="No inquiries yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {inquiries.map((inquiry) => (
            <details key={inquiry._id} className="border border-stone-300 bg-paper p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-sm text-ink">{inquiry.name}</span>
                  <span className="ml-2 text-sm text-stone-600">{inquiry.email}</span>
                </div>
                <span className="text-xs text-stone-600">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                <Badge tone={STATUS_TONE[inquiry.status] || 'neutral'}>{inquiry.status}</Badge>
              </summary>

              <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 text-sm">
                <p className="text-stone-600">{inquiry.description}</p>
                {inquiry.budgetRange && <p><span className="text-stone-600">Budget: </span>{inquiry.budgetRange}</p>}
                {inquiry.phone && <p><span className="text-stone-600">Phone: </span>{inquiry.phone}</p>}

                {inquiry.referenceImages?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {inquiry.referenceImages.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-20 w-20 shrink-0 overflow-hidden border border-stone-300">
                        <img src={url} alt="Reference" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-stone-600">Status:</span>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(inquiry, s)}
                      className={`px-2.5 py-1 text-xs uppercase tracking-wide ${
                        inquiry.status === s ? 'bg-accent-tint text-accent-dark' : 'bg-stone-100 text-stone-600 hover:text-ink'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
