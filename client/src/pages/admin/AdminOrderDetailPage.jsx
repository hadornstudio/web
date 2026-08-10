import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminOrder, useUpdateOrderStatus } from '../../hooks/useOrders';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import PriceTag from '../../components/common/PriceTag';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { toast } from '../../store/useToastStore';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();

  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');

  if (isLoading) return <Spinner />;
  if (!order) return <p>Order not found.</p>;

  const itemColumns = [
    { key: 'image', header: '', className: 'w-14', render: (i) => <img src={i.image} alt="" className="h-10 w-10 object-cover" /> },
    { key: 'title', header: 'Item', render: (i) => <>{i.title}{i.variantLabel && <span className="text-stone-600"> — {i.variantLabel}</span>}</> },
    { key: 'unitPrice', header: 'Unit Price', render: (i) => <PriceTag amount={i.unitPrice} /> },
    { key: 'quantity', header: 'Qty' },
    { key: 'lineTotal', header: 'Line Total', render: (i) => <PriceTag amount={i.lineTotal} /> },
  ];

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    updateStatus.mutate(
      { id: order._id, status: newStatus, note },
      {
        onSuccess: () => { toast.success('Order status updated'); setNote(''); setNewStatus(''); },
        onError: () => toast.error('Could not update status'),
      }
    );
  };

  const addr = order.shippingAddress;

  return (
    <div className="max-w-3xl">
      <button type="button" onClick={() => navigate('/admin/orders')} className="mb-4 text-sm text-stone-600 hover:text-accent">
        ← Back to Orders
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">{order.orderNumber}</h1>
        <Badge tone="accent">{order.status}</Badge>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg">Items</h2>
        <DataTable columns={itemColumns} data={order.items} getRowKey={(i) => i.product + (i.variantId || '')} />

        <div className="mt-4 max-w-xs text-sm">
          <div className="flex justify-between py-1"><span className="text-stone-600">Subtotal</span><PriceTag amount={order.subtotal} /></div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between py-1 text-accent"><span>Discount</span><span>−<PriceTag amount={order.discountTotal} /></span></div>
          )}
          <div className="flex justify-between py-1"><span className="text-stone-600">Shipping</span><PriceTag amount={order.shippingCost} /></div>
          <div className="flex justify-between py-1"><span className="text-stone-600">Tax</span><PriceTag amount={order.tax} /></div>
          <div className="mt-1 flex justify-between border-t border-stone-300 pt-1 font-medium"><span>Total</span><PriceTag amount={order.total} /></div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h2 className="mb-3 font-display text-lg">Shipping Address</h2>
          <p className="text-sm text-stone-600">
            {addr.fullName}<br />
            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
            {addr.city}, {addr.state}, {addr.postalCode}<br />
            {addr.country}
            {addr.phone && <><br />{addr.phone}</>}
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg">Payment</h2>
          <p className="text-sm text-stone-600">
            Provider: {order.payment?.provider}<br />
            Reference: {order.payment?.reference}<br />
            Status: {order.payment?.status}<br />
            {order.payment?.paidAt && <>Paid At: {new Date(order.payment.paidAt).toLocaleString()}</>}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg">Update Status</h2>
        <div className="flex items-end gap-3">
          <Select label="New Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-auto">
            <option value="">Select…</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button onClick={handleUpdateStatus} disabled={!newStatus || updateStatus.isPending}>
            {updateStatus.isPending ? 'Updating…' : 'Update Status'}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">Status History</h2>
        <div className="flex flex-col gap-2">
          {order.statusHistory?.slice().reverse().map((h, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-stone-100 py-2 text-sm">
              <Badge tone="neutral">{h.status}</Badge>
              <span className="text-stone-600">{new Date(h.changedAt).toLocaleString()}</span>
              {h.note && <span className="text-stone-600">— {h.note}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
