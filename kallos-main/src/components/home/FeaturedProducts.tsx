"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  category?: { id: string; name: string; slug: string };
  images: ProductImage[];
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200';

export function FeaturedProducts() {
  const { data: products = [] } = useQuery<FeaturedProduct[]>({
    queryKey: ['products', 'featured'],
    queryFn: () => api.get<FeaturedProduct[]>('/products/featured'),
  });

  const display = products.slice(0, 2);

  return (
    <section className="py-32 lg:py-60 bg-background overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-24 lg:mb-40 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] tracking-[0.4em] text-accent uppercase mb-6"
          >
            The Collection
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-editorial text-5xl md:text-7xl lg:text-8xl text-primary"
          >
            Curated <span className="italic font-light">Excellence</span>
          </motion.h2>
        </div>

        <div className="space-y-40 lg:space-y-64">
          {display.map((product, index) => {
            const primaryImage = product.images.find(img => img.isPrimary) ?? product.images[0];
            const imageUrl = primaryImage?.url || FALLBACK_IMAGE;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1 }}
                className={`flex flex-col lg:flex-row items-center gap-16 lg:gap-32 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="w-full lg:w-3/5 group">
                  <Link href={`/product/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </Link>
                </div>

                <div className="w-full lg:w-2/5 flex flex-col items-start">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
                    {product.category?.name || 'Luxury Staple'}
                  </span>
                  <h3 className="font-editorial text-4xl md:text-5xl text-primary mb-6 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-sm">
                    Meticulously crafted with a focus on silhouette and materiality.
                    A testament to our commitment to refined, enduring luxury.
                  </p>
                  <div className="flex items-center justify-between w-full border-t border-border pt-8 mt-4">
                    <span className="text-xs tracking-widest text-primary font-medium uppercase">
                      From {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.basePrice)}
                    </span>
                    <Link
                      href={`/product/${product.slug}`}
                      className="group relative overflow-hidden"
                    >
                      <span className="text-[10px] tracking-[0.2em] uppercase text-primary font-medium py-2 block">
                        Discover
                      </span>
                      <div className="absolute bottom-0 left-0 w-full h-px bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-40 lg:mt-64 text-center">
          <Link
            href="/shop"
            className="group relative inline-flex flex-col items-center gap-4"
          >
            <span className="text-[10px] tracking-[0.5em] uppercase text-primary font-medium">
              View Entire Collection
            </span>
            <div className="w-12 h-px bg-primary/20 group-hover:w-24 group-hover:bg-accent transition-all duration-700" />
          </Link>
        </div>
      </div>
    </section>
  );
}
