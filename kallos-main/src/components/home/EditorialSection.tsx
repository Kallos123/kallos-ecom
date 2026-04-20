"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function EditorialSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const textY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={sectionRef} className="py-24 lg:py-40 bg-card overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div style={{ y: imageY }} className="relative">
            <div className="aspect-[4/5] relative overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200"
                alt="Editorial"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 border border-kallos-gold/30" />
          </motion.div>

          <motion.div style={{ y: textY }} className="lg:pl-12">
            <p className="text-xs tracking-[0.4em] text-kallos-gold mb-6 uppercase">
              Our Philosophy
            </p>
            <h2 className="font-editorial text-4xl md:text-5xl lg:text-6xl text-foreground tracking-wide mb-8">
              Crafted for
              <br />
              <span className="italic font-light">the Discerning</span>
            </h2>
            <div className="space-y-6 text-foreground/60 leading-relaxed text-sm">
              <p>
                At KALLOS, we believe that true luxury lies in the details — 
                the weight of a fabric, the precision of a stitch, the 
                timelessness of a silhouette.
              </p>
              <p>
                Each piece in our collection is thoughtfully curated to 
                embody understated elegance, designed for those who 
                appreciate quality over quantity.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-4 mt-10 text-foreground text-xs tracking-[0.2em] uppercase group"
            >
              <span>Learn More</span>
              <span className="w-8 h-px bg-kallos-gold transform group-hover:w-12 transition-all duration-500" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
