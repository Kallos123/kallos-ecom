import { api } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderNumber: string;
}

interface RazorpayCheckoutOptions {
  orderId: string;
  storeName?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: () => Promise<void> | void;
  onDismiss?: () => void;
}

async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({
  orderId,
  storeName = 'KALLOS',
  prefill,
  onSuccess,
  onDismiss,
}: RazorpayCheckoutOptions) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Failed to load payment gateway. Please try again.');
  }

  const order = await api.post<RazorpayOrderResponse>(`/payments/orders/${orderId}/create`);

  const razorpay = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: storeName,
    description: `Order ${order.orderNumber}`,
    order_id: order.razorpayOrderId,
    prefill,
    theme: { color: '#B4975A' },
    handler: async (response: any) => {
      await api.post('/payments/verify', {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      await onSuccess();
    },
    modal: {
      ondismiss: onDismiss,
    },
  });

  razorpay.open();
}