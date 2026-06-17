"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ShopFilters({ currentCategory }: { currentCategory?: string }) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-wrap gap-4">
      <Link
        href="/shop"
        className={`px-4 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-300 border ${
          !currentCategory
            ? 'border-kallos-crimson text-kallos-crimson'
            : 'border-kallos-ivory/20 text-kallos-ivory/60 hover:border-kallos-ivory/40 hover:text-kallos-ivory'
        }`}
      >
        All
      </Link>
      {categories.map((cat) => {
        const isActive = currentCategory === cat.slug;
        return (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className={`px-4 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-300 border ${
              isActive
                ? 'border-kallos-crimson text-kallos-crimson'
                : 'border-kallos-ivory/20 text-kallos-ivory/60 hover:border-kallos-ivory/40 hover:text-kallos-ivory'
            }`}
          >
            {cat.name}
          </Link>
        );
      })}
    </div>
  );
}
