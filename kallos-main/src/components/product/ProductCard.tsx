"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  category?: { id: string; name: string; slug: string };
  images: { id: string; url: string; isPrimary: boolean }[];
}

type ProductCardProps = {
  product: ProductCardData;
  index?: number;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const primaryImage = product.images.find(img => img.isPrimary) ?? product.images[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-kallos-charcoal mb-4">
          {primaryImage?.url ? (
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <Image
              src={FALLBACK_IMAGE}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          )}
          <div className="absolute inset-0 bg-kallos-black/0 group-hover:bg-kallos-black/20 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <span className="inline-block px-4 py-2 bg-kallos-ivory text-kallos-black text-xs tracking-[0.15em] uppercase">
              View Product
            </span>
          </div>
        </div>
        <div className="space-y-1">
          {product.category && (
            <p className="text-[10px] tracking-[0.2em] uppercase text-kallos-warm-grey">
              {product.category.name}
            </p>
          )}
          <h3 className="font-editorial text-lg text-kallos-ivory group-hover:text-kallos-crimson transition-colors duration-300">
            {product.name}
          </h3>
          <p className="text-sm text-kallos-warm-grey">
            {formatPrice(product.basePrice)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
