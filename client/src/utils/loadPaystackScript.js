let paystackPromise;

export function loadPaystackScript() {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop);
  if (paystackPromise) return paystackPromise;

  paystackPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.head.appendChild(script);
  });

  return paystackPromise;
}
