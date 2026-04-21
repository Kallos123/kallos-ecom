import { notFound } from 'next/navigation';

import { InfoPageClient } from '@/components/layout/InfoPageClient';
import { INFO_PAGE_SLUGS, isInfoPageSlug } from '@/lib/editorial-pages';

export function generateStaticParams() {
  return INFO_PAGE_SLUGS.map((slug) => ({ slug }));
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isInfoPageSlug(slug)) {
    notFound();
  }

  return <InfoPageClient slug={slug} />;
}