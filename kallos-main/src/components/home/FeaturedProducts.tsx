"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=90";

const ease = [0.23, 1, 0.32, 1] as const;

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function ProductSkeleton({ reverse }: { reverse?: boolean }) {
  return (
    <div
      className={`flex flex-col lg:flex-row items-stretch gap-0 ${
        reverse ? "lg:flex-row-reverse" : ""
      }`}
    >
      <div className="w-full lg:w-[58%] aspect-[4/5] bg-foreground/5 animate-pulse" />
      <div className="w-full lg:w-[42%] flex flex-col justify-center px-8 lg:px-14 py-12 gap-6">
        <div className="h-2.5 w-16 bg-foreground/5 animate-pulse" />
        <div className="h-12 w-3/4 bg-foreground/5 animate-pulse" />
        <div className="space-y-2">
          <div className="h-2.5 w-full bg-foreground/5 animate-pulse" />
          <div className="h-2.5 w-5/6 bg-foreground/5 animate-pulse" />
          <div className="h-2.5 w-4/6 bg-foreground/5 animate-pulse" />
        </div>
        <div className="h-px w-full bg-foreground/5" />
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-foreground/5 animate-pulse" />
          <div className="h-3 w-16 bg-foreground/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ── Single product row ────────────────────────────────────────────────── */
function ProductRow({
  product,
  index,
}: {
  product: FeaturedProduct;
  index: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const reverse = index % 2 === 1;

  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });

  const imageX = useTransform(
    scrollYProgress,
    [0, 1],
    [reverse ? "4%" : "-4%", "0%"]
  );

  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];
  const imageUrl = primaryImage?.url || FALLBACK_IMAGE;
  const label = `0${index + 1}`;

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease }}
      className={`relative flex flex-col lg:flex-row items-stretch gap-0 ${
        reverse ? "lg:flex-row-reverse" : ""
      }`}
    >
      {/* ── Image ── */}
      <div className="w-full lg:w-[58%] overflow-hidden bg-muted/30">
        <motion.div
          style={{ x: imageX }}
          className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-full min-h-[460px] overflow-hidden"
        >
          <Link
            href={`/product/${product.slug}`}
            className="absolute inset-0 overflow-hidden group"
          >
            {/* Clip zoom here so scale never paints a “ghost” strip beside the image */}
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-[2.5s] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
              />
            </div>
            {/* Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />

            {/* Sequence number on image */}
            <span className="absolute top-6 left-6 font-editorial text-[11px] tracking-[0.3em] text-white/60">
              {label}
            </span>

            {/* Hover CTA on image */}
            <div className="absolute inset-0 flex items-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <span className="text-[10px] tracking-[0.35em] uppercase text-white font-medium border-b border-white/40 pb-1">
                Shop now
              </span>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ── Text ── */}
      <div
        className={`w-full lg:w-[42%] flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-16 py-14 lg:py-0 ${
          reverse ? "lg:pr-0 xl:pr-0 lg:pl-14 xl:pl-16" : ""
        }`}
      >
        {/* Large ghost number — editorial accent */}
        <span
          className="font-editorial text-[5rem] lg:text-[7rem] leading-none text-foreground/[0.04] select-none mb-2 -ml-1"
          aria-hidden
        >
          {label}
        </span>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="text-[9px] tracking-[0.45em] uppercase text-kallos-crimson mb-5 font-medium"
        >
          {product.category?.name ?? "Accessories"}
        </motion.p>

        <motion.h3
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, delay: 0.18, ease }}
          className="font-editorial text-[clamp(2.4rem,4vw,4rem)] text-foreground leading-[0.95] tracking-tight mb-8"
        >
          {product.name}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.28, ease }}
          className="text-muted-foreground text-[13px] leading-[1.85] mb-10 max-w-[320px]"
        >
          Made in small batches. Good materials, clean cuts. Built to wear for years, not a season.
        </motion.p>

        {/* Price + CTA row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.36, ease }}
          className="flex items-end justify-between border-t border-border pt-8"
        >
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase text-foreground/30 mb-1.5">
              From
            </p>
            <p className="font-editorial text-xl text-foreground tracking-wide">
              {formatINR(product.basePrice)}
            </p>
          </div>

          <Link
            href={`/product/${product.slug}`}
            className="group relative flex flex-col items-end gap-1.5"
          >
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground group-hover:text-kallos-crimson transition-colors duration-400 font-medium">
              Shop
            </span>
            <div className="h-px w-full bg-foreground/20" />
            <div className="absolute bottom-0 left-0 h-px w-0 bg-kallos-crimson group-hover:w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" />
          </Link>
        </motion.div>
      </div>

      {/* Divider for reverse rows — vertical line accent on the join edge */}
      <div className="hidden lg:block absolute top-[10%] bottom-[10%] left-[58%] w-px bg-border/40 -translate-x-1/2 pointer-events-none" />
    </motion.div>
  );
}

/* ── Main Section ─────────────────────────────────────────────────────── */
export function FeaturedProducts() {
  const { data: products = [], isLoading } = useQuery<FeaturedProduct[]>({
    queryKey: ["products", "featured"],
    queryFn: () => api.get<FeaturedProduct[]>("/products/featured"),
  });

  const display = products.slice(0, 2);

  return (
    <section className="bg-background overflow-hidden">

      {/* ── Section header ── */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-28 lg:pt-40 pb-20 lg:pb-28">
        <div className="flex items-end justify-between gap-8">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="text-[9px] tracking-[0.5em] uppercase text-kallos-crimson mb-5 font-medium"
            >
              New in
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.1, ease }}
              className="font-editorial text-[clamp(3rem,8vw,7.5rem)] text-foreground leading-[0.9] tracking-tight"
            >
              This{" "}
              <span className="italic font-light text-foreground/50">
                season
              </span>
            </motion.h2>
          </div>

          {/* Right label */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden md:block text-right text-[10px] tracking-[0.3em] text-foreground/25 uppercase leading-relaxed mb-2 shrink-0"
          >
            Spring 2025
            <br />
            {display.length} pieces
          </motion.p>
        </div>

        {/* Accent rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2, ease }}
          className="mt-10 h-px bg-gradient-to-r from-kallos-crimson/60 via-kallos-crimson/20 to-transparent origin-left"
        />
      </div>

      {/* ── Products ── */}
      <div className="space-y-1">
        {isLoading ? (
          <>
            <ProductSkeleton />
            <ProductSkeleton reverse />
          </>
        ) : display.length > 0 ? (
          display.map((product, index) => (
            <ProductRow key={product.id} product={product} index={index} />
          ))
        ) : (
          /* Fallback when API returns empty */
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20 text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/25">
              Coming soon
            </p>
          </div>
        )}
      </div>

      {/* ── Footer CTA ── */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 lg:py-36">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-t border-border pt-12"
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/30 max-w-xs leading-relaxed">
            Limited runs. Ships in 3–5 days across India.
          </p>

          <Link
            href="/shop"
            className="group flex items-center gap-5 shrink-0"
          >
            <span className="text-[10px] tracking-[0.45em] uppercase text-foreground group-hover:text-kallos-crimson transition-colors duration-400 font-medium">
              Shop all
            </span>
            <div className="relative h-px w-12 bg-foreground/20 overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-0 bg-kallos-crimson group-hover:w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" />
            </div>
          </Link>
        </motion.div>
      </div>

    </section>
  );
}
