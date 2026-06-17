"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface OrderItem {
  productSnapshot: { name: string };
  quantity: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
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

const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const formatStatus = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
  });

  return (
    <div>
      <p className="text-[10px] tracking-[0.4em] text-kallos-crimson uppercase mb-3">History</p>
      <h1 className="font-editorial text-4xl text-kallos-ivory mb-10">My Orders</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-kallos-charcoal animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-12 h-12 text-kallos-warm-grey mx-auto mb-4" />
          <p className="text-kallos-warm-grey">No orders yet</p>
          <Link href="/shop" className="inline-block mt-6 px-8 py-3 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="block bg-kallos-charcoal p-6 hover:bg-kallos-charcoal/80 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <p className="text-kallos-ivory text-sm font-medium">{order.orderNumber}</p>
                    <span className={`text-xs ${STATUS_COLORS[order.orderStatus] ?? 'text-kallos-warm-grey'}`}>
                      {formatStatus(order.orderStatus)}
                    </span>
                  </div>
                  <p className="text-kallos-warm-grey text-xs mb-3">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-kallos-ivory/60 text-xs truncate">
                    {order.items.map(i => `${i.productSnapshot.name} ×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <p className="text-kallos-ivory text-sm">{formatPrice(order.totalAmount)}</p>
                  <ChevronRight className="w-4 h-4 text-kallos-warm-grey group-hover:text-kallos-crimson transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
