"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=1200&q=90",
  "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1200&q=90",
  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=1200&q=90",
];

const ease = [0.23, 1, 0.32, 1] as const;

function CategoryCard({
  category,
  imageIndex,
  indexLabel,
  className,
  imageSizes,
}: {
  category: Category;
  imageIndex: number;
  indexLabel: string;
  className?: string;
  imageSizes: string;
}) {
  const src = FALLBACK_IMAGES[imageIndex % FALLBACK_IMAGES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, ease }}
      className={className}
    >
      <Link
        href={`/shop?category=${category.slug}`}
        className="group relative block h-full min-h-[220px] overflow-hidden bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kallos-crimson focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={src}
            alt={category.name}
            fill
            sizes={imageSizes}
            className="object-cover transition-transform duration-[2.2s] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-black/5" />
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-kallos-crimson/20" />

        <span
          className="pointer-events-none absolute top-5 left-5 font-editorial text-[10px] tracking-[0.35em] text-white/45"
          aria-hidden
        >
          {indexLabel}
        </span>

        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
          <p className="font-editorial text-[clamp(1.5rem,3vw,2.75rem)] text-white leading-[0.95] tracking-tight mb-3">
            {category.name}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-[0.4em] uppercase text-white/55 font-medium">
              Shop now
            </span>
            <span className="h-px flex-1 max-w-[48px] bg-white/25 origin-left scale-x-50 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-5">
      <div className="w-full lg:w-[58%] min-h-[420px] lg:min-h-[560px] bg-foreground/6 animate-pulse" />
      <div className="w-full lg:w-[42%] flex flex-col gap-4 lg:gap-5 lg:min-h-[560px]">
        <div className="flex-1 min-h-[200px] bg-foreground/6 animate-pulse" />
        <div className="flex-1 min-h-[200px] bg-foreground/6 animate-pulse" />
      </div>
    </div>
  );
}

export function CategoriesSection() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
    staleTime: 5 * 60 * 1000,
  });

  const display = categories.slice(0, 3);

  return (
    <section className="relative bg-background border-t border-border overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-24 lg:pt-32 pb-24 lg:pb-36">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 mb-12 lg:mb-14"
        >
          <div>
            <p className="text-[9px] tracking-[0.5em] uppercase text-kallos-crimson mb-4 font-medium">
              Categories
            </p>
            <h2 className="font-editorial text-[clamp(2.4rem,6vw,4.5rem)] text-foreground leading-[0.92] tracking-tight">
              Collections
            </h2>
          </div>

          <Link
            href="/shop"
            className="group flex items-center gap-5 shrink-0 self-start sm:self-auto"
          >
            <span className="text-[10px] tracking-[0.45em] uppercase text-foreground/40 group-hover:text-kallos-crimson transition-colors duration-400 font-medium">
              View all
            </span>
            <div className="relative h-px w-12 bg-foreground/15 overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-0 bg-kallos-crimson group-hover:w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" />
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.08, ease }}
          className="mb-12 lg:mb-16 h-px bg-linear-to-r from-kallos-crimson/55 via-kallos-crimson/15 to-transparent origin-left"
        />

        {isLoading ? (
          <CategoriesSkeleton />
        ) : display.length === 0 ? (
          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-foreground/25 py-24">
            Coming soon
          </p>
        ) : display.length === 1 ? (
          <CategoryCard
            category={display[0]}
            imageIndex={0}
            indexLabel="01"
            imageSizes="(max-width: 1024px) 100vw, 100vw"
            className="w-full max-w-3xl mx-auto min-h-[380px] lg:min-h-[480px]"
          />
        ) : display.length === 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 md:min-h-[420px] lg:min-h-[500px]">
            {display.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                imageIndex={i}
                indexLabel={`0${i + 1}`}
                imageSizes="(max-width: 768px) 100vw, 50vw"
                className="min-h-[320px] h-full"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-5">
            <div className="w-full lg:w-[58%] lg:min-h-[560px]">
              <CategoryCard
                category={display[0]}
                imageIndex={0}
                indexLabel="01"
                imageSizes="(max-width: 1024px) 100vw, 58vw"
                className="h-full min-h-[420px] lg:min-h-full"
              />
            </div>
            <div className="w-full lg:w-[42%] flex flex-col gap-4 lg:gap-5 lg:min-h-[560px]">
              <div className="flex-1 min-h-[260px] lg:min-h-0">
                <CategoryCard
                  category={display[1]}
                  imageIndex={1}
                  indexLabel="02"
                  imageSizes="(max-width: 1024px) 100vw, 42vw"
                  className="h-full min-h-[260px] lg:min-h-full"
                />
              </div>
              <div className="flex-1 min-h-[260px] lg:min-h-0">
                <CategoryCard
                  category={display[2]}
                  imageIndex={2}
                  indexLabel="03"
                  imageSizes="(max-width: 1024px) 100vw, 42vw"
                  className="h-full min-h-[260px] lg:min-h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
