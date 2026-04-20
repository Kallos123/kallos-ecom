"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Fallback images cycled when API categories have no image
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
  'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
];

export function CategoriesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const y3 = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const y4 = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const y5 = useTransform(scrollYProgress, [0, 1], [120, -120]);

  const transforms = [y1, y2, y3, y4, y5];

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
    staleTime: 5 * 60 * 1000,
  });

  const display = categories.slice(0, 3);

  return (
    <section ref={sectionRef} className="py-24 lg:py-40 bg-background overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <h2 className="font-editorial text-4xl md:text-6xl text-foreground mb-6">
            The <span className="italic text-kallos-gold">Collections</span>
          </h2>
          <p className="text-foreground/50 text-sm tracking-widest uppercase">
            Browse by Category
          </p>
        </div>

        {display.length > 0 && (
          <div className={`grid grid-cols-1 gap-12 lg:gap-20 ${
            display.length === 1 ? 'md:grid-cols-1 max-w-sm' :
            display.length === 2 ? 'md:grid-cols-2' :
            'md:grid-cols-3'
          }`}>
            {display.map((cat, i) => (
              <motion.div
                key={cat.id}
                style={{ y: transforms[i % transforms.length] }}
                className="group cursor-pointer"
              >
                <Link href={`/shop?category=${cat.slug}`}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <Image
                      src={FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-background/20 group-hover:bg-background/10 transition-colors duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center overflow-hidden">
                        <motion.span
                          initial={{ y: "100%" }}
                          whileInView={{ y: 0 }}
                          className="block font-editorial text-4xl lg:text-5xl text-foreground"
                        >
                          {cat.name}
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
