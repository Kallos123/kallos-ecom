"use client";

import Link from 'next/link';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  getInfoPageContent,
  type InfoPageSection,
  type InfoPageSlug,
} from '@/lib/editorial-pages';
import {
  DEFAULT_STORE_SETTINGS,
  useStoreSettings,
} from '@/lib/store-settings';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

function renderSection(section: InfoPageSection) {
  if (section.type === 'prose') {
    return (
      <div className="space-y-4">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-kallos-ivory/70 leading-relaxed text-sm md:text-base">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  if (section.type === 'bullets') {
    return (
      <ul className="space-y-3 text-sm md:text-base text-kallos-ivory/70">
        {section.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-kallos-crimson flex-none" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (section.type === 'contact') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {section.items.map((item) => (
          <div key={item.label} className="border border-kallos-ivory/10 px-5 py-5 bg-kallos-charcoal/60">
            <p className="text-[10px] tracking-[0.3em] uppercase text-kallos-crimson mb-2">{item.label}</p>
            {item.href ? (
              item.href.startsWith('mailto:') ? (
                <a href={item.href} className="text-kallos-ivory hover:text-kallos-crimson transition-colors break-all">
                  {item.value}
                </a>
              ) : (
                <Link href={item.href} className="text-kallos-ivory hover:text-kallos-crimson transition-colors break-all">
                  {item.value}
                </Link>
              )
            ) : (
              <p className="text-kallos-ivory/80 text-sm leading-relaxed">{item.value}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (section.type === 'faq') {
    return (
      <Accordion type="single" collapsible className="border border-kallos-ivory/10 px-5 bg-kallos-charcoal/60">
        {section.items.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`} className="border-kallos-ivory/10">
            <AccordionTrigger className="text-kallos-ivory hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-kallos-ivory/65 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <div className="border border-kallos-crimson/20 bg-kallos-charcoal px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-kallos-ivory text-lg mb-2">{section.title}</p>
        <p className="text-kallos-ivory/65 text-sm leading-relaxed max-w-2xl">{section.body}</p>
      </div>
      <Link
        href={section.href}
        className="inline-flex items-center justify-center px-5 py-3 border border-kallos-crimson/40 text-kallos-crimson text-[10px] tracking-[0.3em] uppercase hover:bg-kallos-crimson hover:text-kallos-ivory transition-colors"
      >
        {section.linkLabel}
      </Link>
    </div>
  );
}

export function InfoPageClient({ slug }: { slug: InfoPageSlug }) {
  const { data: settings = DEFAULT_STORE_SETTINGS } = useStoreSettings();
  const page = getInfoPageContent(slug, settings);

  return (
    <main className="bg-kallos-black min-h-screen">
      <Header />
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="border-b border-kallos-ivory/10 pb-12 mb-12">
            <p className="text-[10px] tracking-[0.4em] text-kallos-crimson uppercase mb-4">{page.eyebrow}</p>
            <h1 className="font-editorial text-4xl md:text-6xl text-kallos-ivory mb-6">{page.title}</h1>
            <p className="text-kallos-ivory/60 text-sm md:text-lg leading-relaxed max-w-3xl">{page.lede}</p>
          </div>

          <div className="space-y-12">
            {page.sections.map((section) => (
              <div key={`${section.type}-${section.title}`} className="space-y-5">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-kallos-crimson mb-3">{page.category}</p>
                  <h2 className="text-kallos-ivory text-xl md:text-2xl">{section.title}</h2>
                </div>
                {renderSection(section)}
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}