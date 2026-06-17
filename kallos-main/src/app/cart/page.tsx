"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface CartItem {
  id: string;
  quantity: number;
  variant: {
    id: string;
    size: string | null;
    color: string | null;
    price: number | null;
    product: {
      id: string;
      name: string;
      slug: string;
      basePrice: number;
      images: { url: string }[];
    };
  };
}

interface Cart {
  items: CartItem[];
  subtotal: number;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function CartPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: () => api.get<Cart>('/cart'),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.patch(`/cart/items/${itemId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/cart/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;

  return (
    <main className="bg-background min-h-screen">
      <Header />

      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-16">
            <p className="text-xs tracking-[0.4em] text-kallos-crimson mb-4 uppercase">Your Selection</p>
            <h1 className="font-editorial text-4xl md:text-5xl lg:text-6xl text-kallos-ivory tracking-wide">
              Shopping Cart
            </h1>
          </div>

          {!user ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-kallos-warm-grey mx-auto mb-6" />
              <p className="text-kallos-warm-grey text-lg mb-8">Sign in to view your cart</p>
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-36 bg-kallos-charcoal animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-kallos-warm-grey mx-auto mb-6" />
              <p className="text-kallos-warm-grey text-lg mb-8">Your cart is empty</p>
              <Link
                href="/shop"
                className="inline-block px-8 py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item, index) => {
                  const product = item.variant.product;
                  const imageUrl = product.images[0]?.url;
                  const price = Number(item.variant.price ?? product.basePrice);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="flex gap-6 p-6 bg-kallos-charcoal"
                    >
                      <div className="relative w-24 h-32 shrink-0 bg-kallos-black overflow-hidden">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="96px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-kallos-warm-grey" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${product.slug}`}
                          className="font-editorial text-lg text-kallos-ivory hover:text-kallos-crimson transition-colors block truncate"
                        >
                          {product.name}
                        </Link>
                        {(item.variant.size || item.variant.color) && (
                          <p className="text-xs text-kallos-warm-grey mt-1 tracking-wide">
                            {[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <p className="text-kallos-ivory mt-2 text-sm">{formatPrice(price)}</p>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 });
                                } else {
                                  removeMutation.mutate(item.id);
                                }
                              }}
                              aria-label={`Decrease quantity for ${product.name}`}
                              className="w-11 h-11 border border-kallos-ivory/20 flex items-center justify-center text-kallos-ivory hover:border-kallos-ivory/40 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-kallos-ivory text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                              aria-label={`Increase quantity for ${product.name}`}
                              className="w-11 h-11 border border-kallos-ivory/20 flex items-center justify-center text-kallos-ivory hover:border-kallos-ivory/40 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeMutation.mutate(item.id)}
                            aria-label={`Remove ${product.name} from cart`}
                            className="h-11 w-11 flex items-center justify-center text-kallos-warm-grey hover:text-kallos-ivory transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-kallos-charcoal p-8 lg:sticky lg:top-32">
                  <h2 className="font-editorial text-xl text-kallos-ivory mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between text-kallos-warm-grey">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-kallos-warm-grey">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="border-t border-kallos-ivory/10 pt-4 mb-8">
                    <div className="flex justify-between text-kallos-ivory">
                      <span>Total</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="block w-full py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors text-center"
                  >
                    Proceed to Checkout
                  </Link>

                  <Link
                    href="/shop"
                    className="block text-center mt-4 text-xs text-kallos-warm-grey hover:text-kallos-ivory transition-colors tracking-wide"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
