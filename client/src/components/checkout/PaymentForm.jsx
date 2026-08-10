import { useState } from 'react';
import { paymentsApi } from '../../api/payments';
import { ordersApi } from '../../api/orders';
import { loadPaystackScript } from '../../utils/loadPaystackScript';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../common/Button';

export default function PaymentForm({ items, couponCode, address, notes, onOrderCreated, onBack }) {
  const [status, setStatus] = useState('idle'); // idle | initializing | paying | creating | error
  const [error, setError] = useState('');
  const [total, setTotal] = useState(null);

  const handlePay = async () => {
    setError('');
    setStatus('initializing');
    try {
      const cartItems = items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }));

      const initRes = await paymentsApi.initialize({ items: cartItems, couponCode: couponCode || undefined, shippingAddress: address });
      const { accessCode, publicKey, total: computedTotal } = initRes.data;
      setTotal(computedTotal);

      const PaystackPop = await loadPaystackScript();
      const popup = new PaystackPop();

      setStatus('paying');
      popup.resumeTransaction(accessCode, {
        onSuccess: async (response) => {
          setStatus('creating');
          try {
            const orderRes = await ordersApi.create({
              items: cartItems,
              couponCode: couponCode || undefined,
              reference: response.reference,
              shippingAddress: address,
              notes,
            });
            onOrderCreated(orderRes.data.order);
          } catch (err) {
            setError(err.response?.data?.message || 'Payment succeeded but we could not record your order. Please contact us with reference ' + response.reference);
            setStatus('error');
          }
        },
        onCancel: () => {
          setStatus('idle');
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start payment. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-stone-600">
        You'll be asked to pay securely via Paystack (card, bank transfer, or USSD). Nothing is charged until you confirm on the payment screen.
      </p>

      {total !== null && (
        <p className="text-sm text-ink">Amount to pay: <span className="text-accent">{formatCurrency(total)}</span></p>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="text-sm text-stone-600 hover:text-accent">
          ← Back
        </button>
        <Button onClick={handlePay} disabled={status === 'initializing' || status === 'paying' || status === 'creating'} className="ml-auto">
          {status === 'initializing' && 'Preparing…'}
          {status === 'paying' && 'Waiting for Payment…'}
          {status === 'creating' && 'Confirming Order…'}
          {(status === 'idle' || status === 'error') && 'Pay Now'}
        </Button>
      </div>
    </div>
  );
}
