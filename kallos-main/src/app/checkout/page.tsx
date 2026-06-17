"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MapPin, Tag, Wallet, ChevronDown, ChevronUp, Plus } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  quantity: number;
  variant: {
    price: number | null;
    size: string | null;
    color: string | null;
    product: { name: string; basePrice: number; images: { url: string }[] };
  };
}

interface Cart {
  items: CartItem[];
  subtotal: number;
}

interface WalletData {
  balance: number;
}

interface CouponResult {
  discountAmount: number;
  isFreeShipping: boolean;
  couponType: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SHIPPING_CHARGE = 99;
const FREE_SHIPPING_ABOVE = 999;

const EMPTY_ADDR = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', pincode: '', isDefault: false,
};

const inputCls = "w-full bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-crimson transition-colors text-sm";
const labelCls = "block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2";
const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

// ─── Razorpay helper ─────────────────────────────────────────────────────────

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Address
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  // Wallet
  const [useWallet, setUseWallet] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('RAZORPAY');

  // Error
  const [placeError, setPlaceError] = useState('');

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: cart } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart'),
    enabled: !!user,
  });

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => api.get('/users/addresses'),
    enabled: !!user,
  });

  const { data: wallet } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet'),
    enabled: !!user,
  });

  // Auto-select default address
  useEffect(() => {
    if (addresses.length && !selectedAddressId) {
      const def = addresses.find(a => a.isDefault) ?? addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  // ─── Pricing calc ────────────────────────────────────────────────────────────

  const subtotal = cart?.subtotal ?? 0;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const freeShipping = (appliedCoupon?.isFreeShipping || subtotal - discount >= FREE_SHIPPING_ABOVE);
  const shipping = freeShipping ? 0 : SHIPPING_CHARGE;
  const afterDiscount = subtotal - discount + shipping;
  const walletAvailable = wallet?.balance ?? 0;
  const walletToUse = useWallet ? Math.min(walletAvailable, afterDiscount) : 0;
  const toPay = Math.max(0, afterDiscount - walletToUse);

  // Determine actual payment method string for API
  const apiPaymentMethod = (() => {
    if (toPay === 0) return 'WALLET';
    if (paymentMethod === 'COD') return walletToUse > 0 ? 'COD' : 'COD';
    return walletToUse > 0 ? 'RAZORPAY_AND_WALLET' : 'RAZORPAY';
  })();

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const addAddressMutation = useMutation({
    mutationFn: () => api.post('/users/addresses', addrForm),
    onSuccess: (newAddr: any) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSelectedAddressId(newAddr.id);
      setShowAddAddr(false);
      setAddrForm(EMPTY_ADDR);
    },
  });

  const couponMutation = useMutation({
    mutationFn: () => api.post<CouponResult>('/coupons/validate', { code: couponInput, cartSubtotal: subtotal }),
    onSuccess: (data) => {
      setAppliedCoupon(data);
      setCouponCode(couponInput);
      setCouponError('');
    },
    onError: (e: any) => {
      setCouponError(e.message || 'Invalid coupon');
      setAppliedCoupon(null);
      setCouponCode('');
    },
  });

  const placeMutation = useMutation({
    mutationFn: () => api.post<{ id: string; orderNumber: string; orderStatus: string }>('/orders', {
      addressId: selectedAddressId,
      paymentMethod: apiPaymentMethod,
      couponCode: couponCode || undefined,
      walletAmountToUse: walletToUse,
    }),
    onSuccess: async (order) => {
      if (order.orderStatus === 'PENDING_PAYMENT') {
        // Razorpay flow
        await handleRazorpay(order.id);
      } else {
        // COD or fully paid by wallet
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        router.push(`/account/orders/${order.id}?placed=1`);
      }
    },
    onError: (e: any) => setPlaceError(e.message || 'Something went wrong. Please try again.'),
  });

  const handleRazorpay = async (orderId: string) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) { setPlaceError('Failed to load payment gateway. Please try again.'); return; }

    const rzpOrder = await api.post<{
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
      orderNumber: string;
    }>(`/payments/orders/${orderId}/create`);

    const rzp = new window.Razorpay({
      key: rzpOrder.keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      name: 'KALLOS',
      description: `Order ${rzpOrder.orderNumber}`,
      order_id: rzpOrder.razorpayOrderId,
      prefill: { name: `${user?.firstName} ${user?.lastName}`, email: user?.email },
      theme: { color: '#9f1239' },
      handler: async (response: any) => {
        await api.post('/payments/verify', {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        router.push(`/account/orders/${orderId}?placed=1`);
      },
      modal: {
        ondismiss: () => setPlaceError('Payment cancelled. Your order is saved — you can retry from your orders page.'),
      },
    });
    rzp.open();
  };

  const setAddr = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddrForm(p => ({ ...p, [f]: f === 'isDefault' ? e.target.checked : e.target.value }));

  if (!user) {
    return (
      <main className="bg-background min-h-screen">
        <Header />
        <div className="pt-40 text-center">
          <p className="text-kallos-warm-grey mb-6">Please sign in to checkout</p>
          <Link href="/login" className="px-8 py-3 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  if (!cart?.items.length) {
    return (
      <main className="bg-background min-h-screen">
        <Header />
        <div className="pt-40 text-center">
          <p className="text-kallos-warm-grey mb-6">Your cart is empty</p>
          <Link href="/shop" className="px-8 py-3 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      <Header />
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="text-[10px] tracking-[0.4em] text-kallos-crimson uppercase mb-3">Almost there</p>
          <h1 className="font-editorial text-4xl md:text-5xl text-kallos-ivory mb-12">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left — form */}
            <div className="lg:col-span-2 space-y-10">

              {/* ── Address ── */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-4 h-4 text-kallos-crimson" />
                  <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory">Delivery Address</h2>
                </div>

                {addresses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {addresses.map(addr => (
                      <label key={addr.id} className={`flex items-start gap-4 p-5 bg-kallos-charcoal cursor-pointer border-l-2 transition-colors ${selectedAddressId === addr.id ? 'border-kallos-crimson' : 'border-transparent'}`}>
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-kallos-crimson"
                        />
                        <div className="text-sm">
                          <p className="text-kallos-ivory font-medium">{addr.fullName} · {addr.phone}</p>
                          <p className="text-kallos-warm-grey mt-0.5">
                            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          {addr.isDefault && <span className="text-[9px] tracking-widest uppercase text-kallos-crimson">Default</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowAddAddr(v => !v)}
                  className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-kallos-ivory/60 hover:text-kallos-crimson transition-colors"
                >
                  {showAddAddr ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {showAddAddr ? 'Cancel' : 'Add New Address'}
                </button>

                {showAddAddr && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-kallos-charcoal p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="checkout-full-name" className={labelCls}>Full Name</label>
                        <input id="checkout-full-name" className={inputCls} value={addrForm.fullName} onChange={setAddr('fullName')} required />
                      </div>
                      <div>
                        <label htmlFor="checkout-phone" className={labelCls}>Phone</label>
                        <input id="checkout-phone" className={inputCls} value={addrForm.phone} onChange={setAddr('phone')} required placeholder="10-digit" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="checkout-address-line1" className={labelCls}>Address Line 1</label>
                      <input id="checkout-address-line1" className={inputCls} value={addrForm.addressLine1} onChange={setAddr('addressLine1')} required />
                    </div>
                    <div>
                      <label htmlFor="checkout-address-line2" className={labelCls}>Address Line 2 (optional)</label>
                      <input id="checkout-address-line2" className={inputCls} value={addrForm.addressLine2} onChange={setAddr('addressLine2')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label htmlFor="checkout-city" className={labelCls}>City</label>
                        <input id="checkout-city" className={inputCls} value={addrForm.city} onChange={setAddr('city')} required />
                      </div>
                      <div>
                        <label htmlFor="checkout-state" className={labelCls}>State</label>
                        <input id="checkout-state" className={inputCls} value={addrForm.state} onChange={setAddr('state')} required />
                      </div>
                      <div>
                        <label htmlFor="checkout-pincode" className={labelCls}>Pincode</label>
                        <input id="checkout-pincode" className={inputCls} value={addrForm.pincode} onChange={setAddr('pincode')} required maxLength={6} />
                      </div>
                    </div>
                    <button
                      onClick={() => addAddressMutation.mutate()}
                      disabled={addAddressMutation.isPending}
                      className="px-6 py-3 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors disabled:opacity-50"
                    >
                      {addAddressMutation.isPending ? 'Saving...' : 'Save & Select'}
                    </button>
                  </motion.div>
                )}
              </div>

              {/* ── Coupon ── */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Tag className="w-4 h-4 text-kallos-crimson" />
                  <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory">Coupon Code</h2>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-kallos-charcoal px-5 py-4">
                    <div>
                      <p className="text-kallos-ivory text-sm">{couponCode}</p>
                      <p className="text-green-400 text-xs mt-0.5">
                        -{formatPrice(appliedCoupon.discountAmount)}
                        {appliedCoupon.isFreeShipping && ' + Free Shipping'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponInput(''); }}
                      className="text-xs text-kallos-warm-grey hover:text-kallos-ivory transition-colors uppercase tracking-wide"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
                    <input
                      id="coupon-code"
                      className="flex-1 bg-transparent border-b border-kallos-ivory/20 py-3 text-kallos-ivory placeholder:text-kallos-ivory/30 focus:outline-none focus:border-kallos-crimson transition-colors text-sm uppercase tracking-widest"
                      placeholder="Enter code"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    />
                    <button
                      onClick={() => couponMutation.mutate()}
                      disabled={!couponInput || couponMutation.isPending}
                      className="px-6 py-3 border border-kallos-ivory/20 text-kallos-ivory text-xs tracking-[0.2em] uppercase hover:border-kallos-crimson hover:text-kallos-crimson transition-colors disabled:opacity-40"
                    >
                      {couponMutation.isPending ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-red-400 text-xs mt-2">{couponError}</p>}
              </div>

              {/* ── Wallet ── */}
              {walletAvailable > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Wallet className="w-4 h-4 text-kallos-crimson" />
                    <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory">Wallet</h2>
                  </div>
                  <label className="flex items-center justify-between bg-kallos-charcoal px-5 py-4 cursor-pointer">
                    <div>
                      <p className="text-kallos-ivory text-sm">Use wallet balance</p>
                      <p className="text-kallos-warm-grey text-xs mt-0.5">Available: {formatPrice(walletAvailable)}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={e => setUseWallet(e.target.checked)}
                      className="accent-kallos-crimson w-4 h-4"
                    />
                  </label>
                  {useWallet && walletToUse > 0 && (
                    <p className="text-green-400 text-xs mt-2 px-1">-{formatPrice(walletToUse)} from wallet</p>
                  )}
                </div>
              )}

              {/* ── Payment Method ── */}
              {toPay > 0 && (
                <div>
                  <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory mb-6">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                      { value: 'RAZORPAY', label: 'Online Payment', sub: 'UPI, Cards, Net Banking' },
                      { value: 'COD', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
                    ].map(opt => (
                      <label key={opt.value} className={`flex items-center gap-4 p-5 bg-kallos-charcoal cursor-pointer border-l-2 transition-colors ${paymentMethod === opt.value ? 'border-kallos-crimson' : 'border-transparent'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value={opt.value}
                          checked={paymentMethod === opt.value}
                          onChange={() => setPaymentMethod(opt.value as any)}
                          className="accent-kallos-crimson"
                        />
                        <div>
                          <p className="text-kallos-ivory text-sm">{opt.label}</p>
                          <p className="text-kallos-warm-grey text-xs mt-0.5">{opt.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — summary */}
            <div>
              <div className="bg-kallos-charcoal p-8 space-y-6 lg:sticky lg:top-32">
                <h2 className="font-editorial text-xl text-kallos-ivory">Order Summary</h2>

                {/* Cart items */}
                <div className="space-y-4 border-b border-kallos-ivory/10 pb-6">
                  {cart.items.map(item => {
                    const price = Number(item.variant.price ?? item.variant.product.basePrice);
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-14 h-18 shrink-0 bg-kallos-black overflow-hidden">
                          {item.variant.product.images[0]?.url && (
                            <img src={item.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-kallos-ivory text-xs truncate">{item.variant.product.name}</p>
                          {(item.variant.size || item.variant.color) && (
                            <p className="text-kallos-warm-grey text-xs mt-0.5">{[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}</p>
                          )}
                          <p className="text-kallos-warm-grey text-xs mt-0.5">×{item.quantity}</p>
                        </div>
                        <p className="text-kallos-ivory text-xs shrink-0">{formatPrice(price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Pricing breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-kallos-warm-grey">
                    <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Coupon ({couponCode})</span><span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-kallos-warm-grey">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? <span className="text-green-400">Free</span> : formatPrice(shipping)}</span>
                  </div>
                  {walletToUse > 0 && (
                    <div className="flex justify-between text-kallos-warm-grey">
                      <span>Wallet</span><span className="text-green-400">-{formatPrice(walletToUse)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-kallos-ivory font-medium border-t border-kallos-ivory/10 pt-3 mt-2">
                    <span>To Pay</span><span>{formatPrice(toPay)}</span>
                  </div>
                </div>

                {placeError && <p className="text-red-400 text-xs">{placeError}</p>}

                <button
                  onClick={() => { setPlaceError(''); placeMutation.mutate(); }}
                  disabled={!selectedAddressId || placeMutation.isPending}
                  className="w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.3em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors disabled:opacity-50"
                >
                  {placeMutation.isPending
                    ? 'Processing...'
                    : toPay === 0
                    ? 'Place Order'
                    : paymentMethod === 'COD'
                    ? 'Place Order (COD)'
                    : `Pay ${formatPrice(toPay)}`}
                </button>

                <Link href="/cart" className="block text-center text-xs text-kallos-warm-grey hover:text-kallos-ivory transition-colors tracking-wide">
                  ← Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
