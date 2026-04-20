"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Package, CheckCircle2 } from 'lucide-react';

interface OrderItem {
  id: string;
  productSnapshot: { name: string; imageUrl?: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantId: string;
}

interface StatusHistory {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface ReturnRequest {
  id: string;
  status: string;
  reason: string;
}

interface AddressSnapshot {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  walletAmountUsed: number;
  paymentMethod: string;
  createdAt: string;
  addressSnapshot: AddressSnapshot;
  items: OrderItem[];
  statusHistory: StatusHistory[];
  returnRequest: ReturnRequest | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'text-yellow-400',
  CONFIRMED: 'text-blue-400',
  PROCESSING: 'text-blue-400',
  SHIPPED: 'text-purple-400',
  DELIVERED: 'text-green-400',
  CANCELLED: 'text-red-400',
  RETURN_REQUESTED: 'text-orange-400',
  RETURNED: 'text-kallos-warm-grey',
};

const RETURN_REASONS = [
  { value: 'WRONG_SIZE', label: 'Wrong Size' },
  { value: 'WRONG_ITEM', label: 'Wrong Item Received' },
  { value: 'DEFECTIVE', label: 'Defective Product' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as Described' },
  { value: 'CHANGED_MIND', label: 'Changed Mind' },
  { value: 'OTHER', label: 'Other' },
];

const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const formatStatus = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get('placed') === '1';
  const queryClient = useQueryClient();
  const [showReturn, setShowReturn] = useState(false);
  const [returnForm, setReturnForm] = useState({ reason: 'WRONG_SIZE', description: '', refundMethod: 'WALLET' });

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/orders/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  });

  const returnMutation = useMutation({
    mutationFn: () => api.post(`/returns/orders/${id}`, returnForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['order', id] }); setShowReturn(false); },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-kallos-charcoal animate-pulse" />)}
      </div>
    );
  }

  if (!order) return <p className="text-kallos-warm-grey">Order not found</p>;

  const cancellable = ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus);
  const returnable = order.orderStatus === 'DELIVERED' && !order.returnRequest;

  const selectCls = "w-full bg-kallos-black border border-kallos-ivory/20 text-kallos-ivory text-sm px-3 py-2 focus:outline-none focus:border-kallos-gold";
  const inputCls = "w-full bg-transparent border-b border-kallos-ivory/20 py-2 text-kallos-ivory placeholder:text-kallos-ivory/30 text-sm focus:outline-none focus:border-kallos-gold";

  return (
    <div>
      {justPlaced && (
        <div className="flex items-center gap-3 bg-green-400/10 border border-green-400/30 px-6 py-4 mb-8">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 text-sm font-medium">Order placed successfully!</p>
            <p className="text-kallos-warm-grey text-xs mt-0.5">We'll send you updates as your order is processed.</p>
          </div>
        </div>
      )}

      <Link href="/account/orders" className="inline-flex items-center gap-2 text-kallos-warm-grey hover:text-kallos-ivory text-xs tracking-wide mb-8 transition-colors">
        <ArrowLeft className="w-3 h-3" />
        Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-kallos-gold uppercase mb-2">{order.orderNumber}</p>
          <h1 className="font-editorial text-3xl text-kallos-ivory">Order Detail</h1>
        </div>
        <span className={`text-sm ${STATUS_COLORS[order.orderStatus] ?? 'text-kallos-warm-grey'}`}>
          {formatStatus(order.orderStatus)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-kallos-charcoal p-6 space-y-4">
            <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory/60 mb-4">Items</h2>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-start gap-4 pb-4 border-b border-kallos-ivory/10 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-kallos-warm-grey flex-shrink-0" />
                  <div>
                    <p className="text-kallos-ivory text-sm">{item.productSnapshot.name}</p>
                    <p className="text-kallos-warm-grey text-xs mt-0.5">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-kallos-ivory text-sm flex-shrink-0">{formatPrice(item.totalPrice)}</p>
              </div>
            ))}
          </div>

          {/* Status Timeline */}
          <div className="bg-kallos-charcoal p-6">
            <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory/60 mb-6">Status History</h2>
            <div className="space-y-4">
              {order.statusHistory.map((h, i) => (
                <div key={h.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1 ${i === 0 ? 'bg-kallos-gold' : 'bg-kallos-ivory/20'}`} />
                    {i < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-kallos-ivory/10 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-kallos-ivory text-xs">{formatStatus(h.status)}</p>
                    {h.note && <p className="text-kallos-warm-grey text-xs mt-0.5">{h.note}</p>}
                    <p className="text-kallos-ivory/40 text-xs mt-0.5">
                      {new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {cancellable && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="px-6 py-3 border border-red-400/50 text-red-400 text-xs tracking-[0.2em] uppercase hover:bg-red-400/10 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
            {returnable && (
              <button
                onClick={() => setShowReturn(true)}
                className="px-6 py-3 border border-kallos-ivory/20 text-kallos-ivory text-xs tracking-[0.2em] uppercase hover:border-kallos-gold hover:text-kallos-gold transition-colors"
              >
                Request Return
              </button>
            )}
            {order.returnRequest && (
              <p className="text-kallos-warm-grey text-xs py-3">
                Return {formatStatus(order.returnRequest.status)}
              </p>
            )}
          </div>

          {/* Return form */}
          {showReturn && (
            <div className="bg-kallos-charcoal p-6 space-y-4">
              <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory/60">Return Request</h2>
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">Reason</label>
                <select className={selectCls} value={returnForm.reason} onChange={e => setReturnForm(p => ({ ...p, reason: e.target.value }))}>
                  {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">Refund To</label>
                <select className={selectCls} value={returnForm.refundMethod} onChange={e => setReturnForm(p => ({ ...p, refundMethod: e.target.value }))}>
                  <option value="WALLET">Wallet</option>
                  {order.paymentMethod !== 'COD' && <option value="ORIGINAL_PAYMENT">Original Payment Method</option>}
                </select>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.3em] text-kallos-ivory/60 uppercase mb-2">Additional Notes</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Optional details..."
                  value={returnForm.description}
                  onChange={e => setReturnForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => returnMutation.mutate()} disabled={returnMutation.isPending} className="px-6 py-3 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-gold transition-colors disabled:opacity-50">
                  {returnMutation.isPending ? 'Submitting...' : 'Submit'}
                </button>
                <button onClick={() => setShowReturn(false)} className="px-6 py-3 border border-kallos-ivory/20 text-kallos-ivory text-xs tracking-[0.2em] uppercase hover:border-kallos-ivory/40 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary + Address */}
        <div className="space-y-6">
          <div className="bg-kallos-charcoal p-6">
            <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory/60 mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-kallos-warm-grey">
                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span><span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-kallos-warm-grey">
                <span>Shipping</span><span>{order.shippingCharge === 0 ? 'Free' : formatPrice(order.shippingCharge)}</span>
              </div>
              {order.walletAmountUsed > 0 && (
                <div className="flex justify-between text-kallos-warm-grey">
                  <span>Wallet Used</span><span>-{formatPrice(order.walletAmountUsed)}</span>
                </div>
              )}
              <div className="flex justify-between text-kallos-ivory border-t border-kallos-ivory/10 pt-2 mt-2 font-medium">
                <span>Total</span><span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
            <p className="text-kallos-warm-grey text-xs mt-4">
              Payment: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
            </p>
          </div>

          <div className="bg-kallos-charcoal p-6">
            <h2 className="text-xs tracking-[0.3em] uppercase text-kallos-ivory/60 mb-4">Delivery Address</h2>
            <div className="text-sm text-kallos-warm-grey space-y-1">
              <p className="text-kallos-ivory">{order.addressSnapshot.fullName}</p>
              <p>{order.addressSnapshot.addressLine1}</p>
              {order.addressSnapshot.addressLine2 && <p>{order.addressSnapshot.addressLine2}</p>}
              <p>{order.addressSnapshot.city}, {order.addressSnapshot.state} — {order.addressSnapshot.pincode}</p>
              <p>{order.addressSnapshot.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
