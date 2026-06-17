"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Heart, ShoppingBag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: { url: string }[];
  variants: { id: string; size: string | null; color: string | null; stock: number }[];
}

interface WishlistItem {
  id: string;
  product: WishlistProduct;
}

interface Wishlist {
  items: WishlistItem[];
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const FALLBACK = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';

export default function WishlistPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery<Wishlist>({
    queryKey: ['wishlist'],
    queryFn: () => api.get<Wishlist>('/wishlist'),
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: string) => api.post(`/wishlist/${productId}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const addToCartMutation = useMutation({
    mutationFn: (variantId: string) => api.post('/cart/items', { variantId, quantity: 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const items = wishlist?.items ?? [];

  return (
    <main className="bg-background min-h-screen">
      <Header />

      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          <div className="mb-16">
            <p className="text-xs tracking-[0.4em] text-kallos-crimson mb-4 uppercase">Saved Items</p>
            <h1 className="font-editorial text-4xl md:text-5xl lg:text-6xl text-kallos-ivory tracking-wide">
              Your Wishlist
            </h1>
          </div>

          {!user ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-kallos-warm-grey mx-auto mb-6" />
              <p className="text-kallos-warm-grey text-lg mb-4">Sign in to view your wishlist</p>
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-3/4 bg-kallos-charcoal animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-kallos-warm-grey mx-auto mb-6" />
              <p className="text-kallos-warm-grey text-lg mb-8">Your wishlist is empty</p>
              <Link
                href="/shop"
                className="inline-block px-8 py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {items.map((item, index) => {
                const { product } = item;
                const imageUrl = product.images[0]?.url || FALLBACK;
                const firstVariant = product.variants.find(v => v.stock > 0) ?? product.variants[0];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group"
                  >
                    <div className="relative aspect-3/4 bg-kallos-charcoal overflow-hidden mb-4">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      {/* Remove from wishlist */}
                      <button
                        onClick={() => toggleMutation.mutate(product.id)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="absolute top-4 right-4 w-11 h-11 bg-kallos-black/60 flex items-center justify-center hover:bg-kallos-black transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-kallos-crimson text-kallos-crimson" />
                      </button>
                    </div>

                    <Link
                      href={`/product/${product.slug}`}
                      className="font-editorial text-lg text-kallos-ivory hover:text-kallos-crimson transition-colors block"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-kallos-warm-grey mt-1">{formatPrice(product.basePrice)}</p>

                    {firstVariant && (
                      <button
                        onClick={() => addToCartMutation.mutate(firstVariant.id)}
                        disabled={addToCartMutation.isPending}
                        className="w-full mt-4 py-3 border border-kallos-ivory/20 text-kallos-ivory text-xs tracking-[0.15em] uppercase hover:bg-kallos-ivory hover:text-kallos-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
