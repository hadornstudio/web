import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useCartStore } from '../store/useCartStore';
import { calculateEstimatedTotals } from '../utils/calculateEstimatedTotals';
import { gsap, EASE, DURATION, prefersReducedMotion } from '../lib/motion/gsapConfig';
import CheckoutSteps from '../components/checkout/CheckoutSteps';
import ShippingForm from '../components/checkout/ShippingForm';
import OrderReview from '../components/checkout/OrderReview';
import PaymentForm from '../components/checkout/PaymentForm';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState(null);
  const [coupon, setCoupon] = useState(null);
  const stepContentRef = useRef(null);

  // Entrance-only transition (not a crossfade) so PaymentForm — which mounts Paystack's
  // own popup SDK — is never held mid-unmount inside an outgoing animation.
  useGSAP(
    () => {
      if (!stepContentRef.current || prefersReducedMotion()) return;
      gsap.fromTo(
        stepContentRef.current,
        { autoAlpha: 0, x: 16 },
        { autoAlpha: 1, x: 0, duration: DURATION.fast, ease: EASE.hover }
      );
    },
    { dependencies: [step], scope: stepContentRef }
  );

  if (items.length === 0) {
    return (
      <div className="container-page py-24">
        <EmptyState
          title="Your bag is empty"
          description="Add something before checking out."
          action={<Button as={Link} to="/shop">Shop the Collection</Button>}
        />
      </div>
    );
  }

  const totals = calculateEstimatedTotals({ subtotal, discountAmount: coupon?.discountAmount || 0 });

  const handleOrderCreated = (order) => {
    clearCart();
    navigate(`/order-confirmation/${order._id}`);
  };

  return (
    <div className="container-page py-16">
      <h1 className="mb-4 font-display text-4xl">Checkout</h1>
      <CheckoutSteps current={step} />

      <div ref={stepContentRef} className="max-w-xl">
        {step === 0 && (
          <ShippingForm onContinue={(addr) => { setAddress(addr); setStep(1); }} />
        )}

        {step === 1 && address && (
          <OrderReview
            items={items}
            address={address}
            subtotal={subtotal}
            totals={totals}
            coupon={coupon}
            onApplyCoupon={setCoupon}
            onRemoveCoupon={() => setCoupon(null)}
            onBack={() => setStep(0)}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && address && (
          <PaymentForm
            items={items}
            couponCode={coupon?.code}
            address={address}
            onOrderCreated={handleOrderCreated}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}
