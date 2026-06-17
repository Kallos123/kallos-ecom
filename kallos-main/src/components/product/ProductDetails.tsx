"use client";

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Minus, Plus, Star } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Variant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number | null; // priceOverride
  stock: number;
  isActive: boolean;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  user: { firstName: string };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  brand: string | null;
  material: string | null;
  careInstructions: string | null;
  category: { id: string; name: string; slug: string };
  subcategory: { id: string; name: string; slug: string } | null;
  images: ProductImage[];
  variants: Variant[];
  reviews?: Review[];
  _count: { reviews: number };
  flashSalePrice?: number;
}

const FALLBACK = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200';

export function ProductDetails({ product }: { product: Product }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const activeVariants = product.variants?.filter(v => v.isActive) ?? [];
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(activeVariants[0] ?? null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartError, setCartError] = useState('');

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const displayPrice = selectedVariant?.price ?? product.flashSalePrice ?? product.basePrice;

  const sizes = [...new Set(activeVariants.map(v => v.size).filter(Boolean) as string[])];
  const colors = [...new Set(activeVariants.map(v => v.color).filter(Boolean) as string[])];

  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;

  // Wishlist state
  const { data: wishlist } = useQuery<{ items: { id: string; product: { id: string } }[] }>({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist'),
    enabled: !!user,
  });
  const isWishlisted = wishlist?.items?.some(i => i.product.id === product.id) ?? false;

  const wishlistMutation = useMutation({
    mutationFn: () => api.post(`/wishlist/${product.id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const cartMutation = useMutation({
    mutationFn: () => api.post('/cart/items', { variantId: selectedVariant!.id, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setCartError('');
    },
    onError: (e: any) => setCartError(e.message || 'Failed to add to cart'),
  });

  const sortedImages = [...product.images].sort((a, b) =>
    a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1
  );

  const avgRating = product.reviews && product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;
  const reviewCount = product._count.reviews;

  return (
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-32">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-3/4 bg-kallos-charcoal overflow-hidden"
            >
              <Image
                src={sortedImages[selectedImage]?.url || FALLBACK}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </motion.div>

            {sortedImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {sortedImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    aria-label={`View image ${idx + 1} of ${product.name}`}
                    className={`relative w-20 h-24 shrink-0 overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-kallos-crimson' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs tracking-[0.3em] text-kallos-crimson uppercase mb-4">
                {product.subcategory?.name ?? product.category.name}
              </p>
              <h1 className="font-editorial text-4xl lg:text-5xl text-kallos-ivory mb-4">
                {product.name}
              </h1>

              {reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(avgRating)
                            ? 'fill-kallos-crimson text-kallos-crimson'
                            : 'text-kallos-warm-grey'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-kallos-warm-grey">
                    ({reviewCount} reviews)
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-8">
                <p className="text-2xl text-kallos-ivory">
                  {formatPrice(displayPrice)}
                </p>
                {product.flashSalePrice && product.flashSalePrice < product.basePrice && (
                  <p className="text-sm text-kallos-warm-grey line-through">
                    {formatPrice(product.basePrice)}
                  </p>
                )}
              </div>

              <p className="text-kallos-warm-grey leading-relaxed mb-10">
                {product.description}
              </p>

              {sizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs tracking-[0.2em] text-kallos-ivory uppercase mb-4">Size</p>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((size) => {
                      const variant = activeVariants.find(v => v.size === size);
                      const isSelected = selectedVariant?.size === size;
                      const hasStock = variant ? variant.stock > 0 : false;
                      return (
                        <button
                          key={size}
                          onClick={() => variant && setSelectedVariant(variant)}
                          disabled={!hasStock}
                          aria-label={`Select size ${size}`}
                          className={`w-12 h-12 border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'border-kallos-crimson text-kallos-crimson'
                              : 'border-kallos-ivory/20 text-kallos-ivory hover:border-kallos-ivory/40'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {colors.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs tracking-[0.2em] text-kallos-ivory uppercase mb-4">Color</p>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => {
                      const variant = activeVariants.find(v => v.color === color);
                      const isSelected = selectedVariant?.color === color;
                      return (
                        <button
                          key={color}
                          onClick={() => variant && setSelectedVariant(variant)}
                          aria-label={`Select color ${color}`}
                          className={`px-4 py-2 border text-sm transition-all ${
                            isSelected
                              ? 'border-kallos-crimson text-kallos-crimson'
                              : 'border-kallos-ivory/20 text-kallos-ivory hover:border-kallos-ivory/40'
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-10">
                <p className="text-xs tracking-[0.2em] text-kallos-ivory uppercase mb-4">Quantity</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-11 h-11 border border-kallos-ivory/20 flex items-center justify-center text-kallos-ivory hover:border-kallos-ivory/40 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-kallos-ivory">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant?.stock ?? 10, quantity + 1))}
                    aria-label="Increase quantity"
                    className="w-11 h-11 border border-kallos-ivory/20 flex items-center justify-center text-kallos-ivory hover:border-kallos-ivory/40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                {!user ? (
                  <a
                    href="/login"
                    className="flex-1 py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors text-center"
                  >
                    Sign In to Add to Cart
                  </a>
                ) : (
                  <button
                    onClick={() => { setCartError(''); cartMutation.mutate(); }}
                    disabled={cartMutation.isPending || !inStock || !selectedVariant}
                    className="flex-1 py-4 bg-kallos-ivory text-kallos-black text-xs tracking-[0.2em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors disabled:opacity-50"
                  >
                    {cartMutation.isPending ? 'Adding...' : cartMutation.isSuccess ? 'Added!' : inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                )}
                <button
                  onClick={() => user && wishlistMutation.mutate()}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`w-14 h-14 border flex items-center justify-center transition-colors ${
                    isWishlisted
                      ? 'border-kallos-crimson text-kallos-crimson'
                      : 'border-kallos-ivory/20 text-kallos-ivory hover:border-kallos-crimson hover:text-kallos-crimson'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-kallos-crimson' : ''}`} />
                </button>
              </div>
              {cartError && <p className="text-red-400 text-xs mt-2">{cartError}</p>}

              {product.material && (
                <div className="mt-10 pt-8 border-t border-kallos-ivory/10 space-y-3">
                  <p className="text-xs tracking-[0.2em] text-kallos-ivory/60 uppercase">
                    Material: <span className="text-kallos-warm-grey normal-case tracking-normal">{product.material}</span>
                  </p>
                  {product.careInstructions && (
                    <p className="text-xs tracking-[0.2em] text-kallos-ivory/60 uppercase">
                      Care: <span className="text-kallos-warm-grey normal-case tracking-normal">{product.careInstructions}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Reviews */}
              {product.reviews && product.reviews.length > 0 && (
                <div className="mt-12 pt-8 border-t border-kallos-ivory/10">
                  <h3 className="font-editorial text-2xl text-kallos-ivory mb-6">Reviews</h3>
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b border-kallos-ivory/10 pb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? 'fill-kallos-crimson text-kallos-crimson'
                                    : 'text-kallos-warm-grey'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-kallos-warm-grey">{review.user.firstName}</span>
                        </div>
                        {review.title && (
                          <p className="text-sm text-kallos-ivory font-medium mb-1">{review.title}</p>
                        )}
                        {review.body && (
                          <p className="text-sm text-kallos-warm-grey">{review.body}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
