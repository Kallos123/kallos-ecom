"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const KallosModel = dynamic(
  () => import("./KallosModel").then((m) => m.KallosModel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-px w-10 animate-pulse bg-kallos-warm-grey/40 dark:bg-kallos-warm-grey/30" />
      </div>
    ),
  }
);

const ease = [0.23, 1, 0.32, 1] as const;

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.38], [1, 0]);
  const modelY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const modelOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-svh overflow-hidden bg-kallos-ivory text-kallos-charcoal dark:bg-[#0a0a0a] dark:text-kallos-ivory"
    >
      {/* Quiet depth — warm neutrals only; lets the red GLB be the color story */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_100%_40%,rgba(212,196,168,0.12)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_65%_at_90%_35%,rgba(255,255,255,0.04)_0%,transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "120px 120px",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-svh max-w-[1760px] grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)] lg:items-stretch">
        <motion.div
          style={{
            y: reduceMotion ? 0 : textY,
            opacity: reduceMotion ? 1 : textOpacity,
          }}
          className="flex flex-col justify-center px-6 pb-10 pt-28 sm:px-10 lg:px-14 lg:pb-20 lg:pt-24 xl:pl-20"
        >
          <div className="mb-10 flex items-start gap-6 lg:gap-8">
            <div
              className="mt-1 hidden h-24 w-px shrink-0 bg-gradient-to-b from-kallos-gold/70 via-kallos-gold/25 to-transparent sm:block dark:from-kallos-gold/50 dark:via-kallos-gold/15"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease }}
                className="font-sans text-[10px] font-light uppercase tracking-[0.4em] text-kallos-warm-grey dark:text-kallos-warm-grey/90"
              >
                Spring · Summer 25
              </motion.p>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.08, ease }}
                className="relative mt-8 w-[min(100%,380px)]"
              >
                <Image
                  src="/kallos-logo.svg"
                  alt="Kallos"
                  width={640}
                  height={200}
                  priority
                  className="h-auto w-full object-contain object-left dark:hidden"
                  sizes="(max-width: 1024px) 80vw, 380px"
                />
                <Image
                  src="/kallos-logo.light.svg"
                  alt="Kallos"
                  width={640}
                  height={200}
                  priority
                  className="hidden h-auto w-full object-contain object-left dark:block"
                  sizes="(max-width: 1024px) 80vw, 380px"
                />
              </motion.div>

              <motion.p
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.75, delay: 0.22, ease }}
                className="font-serif mt-10 max-w-[20rem] text-[clamp(1.5rem,3.2vw,2.125rem)] font-light leading-[1.25] tracking-tight text-kallos-charcoal/90 dark:text-kallos-ivory/92"
              >
                Pieces you reach for without thinking.
              </motion.p>

              <motion.p
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.34, ease }}
                className="font-sans mt-8 max-w-sm text-[15px] font-light leading-relaxed text-kallos-charcoal/65 dark:text-kallos-ivory/55"
              >
                Small-batch jewelry and objects from our workshop. Metals you can feel, forms that stay calm on the body.
              </motion.p>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.46, ease }}
                className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10 sm:gap-y-3"
              >
                <Link
                  href="/shop"
                  className="group font-sans text-[11px] font-medium uppercase tracking-[0.28em] text-kallos-charcoal transition-colors dark:text-kallos-ivory"
                >
                  <span className="border-b border-kallos-charcoal/25 pb-1 transition-[border-color,color] group-hover:border-[#9f1239]/70 group-hover:text-[#7f1028] dark:border-kallos-ivory/25 dark:group-hover:border-[#c45c6f]/80 dark:group-hover:text-[#e8b4bc]">
                    Shop collection
                  </span>
                </Link>
                <Link
                  href="/shop?sort=newest"
                  className="font-sans text-[11px] font-light uppercase tracking-[0.22em] text-kallos-warm-grey transition-colors hover:text-kallos-charcoal dark:hover:text-kallos-ivory"
                >
                  Just landed
                </Link>
              </motion.div>

              <motion.p
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.58, ease }}
                className="font-sans mt-14 text-[10px] font-light tracking-[0.18em] text-kallos-warm-grey/80 dark:text-kallos-warm-grey/70"
              >
                Hand-finished in India
                <span className="mx-2 text-kallos-charcoal/15 dark:text-white/15" aria-hidden>
                  ·
                </span>
                Ships worldwide
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div
          style={{
            y: reduceMotion ? 0 : modelY,
            opacity: reduceMotion ? 1 : modelOpacity,
          }}
          className="relative flex min-h-[min(48vh,380px)] items-center justify-center px-2 pb-20 pt-4 sm:px-4 lg:min-h-0 lg:px-6 lg:pb-28 lg:pt-16 xl:px-10"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.15 }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_45%,rgba(0,0,0,0.03)_0%,transparent_65%)] dark:bg-[radial-gradient(ellipse_50%_55%_at_50%_48%,rgba(255,255,255,0.06)_0%,transparent_60%)]"
            aria-hidden
          />
          <div className="relative h-[min(76vh,760px)] w-full max-w-[min(100%,680px)] lg:h-[min(88vh,900px)] lg:max-w-none lg:-mr-[4%] xl:-mr-[6%]">
            <div className="absolute inset-0 overflow-visible">
              <KallosModel />
            </div>
            <p className="font-sans absolute -bottom-1 left-1/2 -translate-x-1/2 text-center text-[9px] font-light uppercase tracking-[0.35em] text-kallos-warm-grey/60 lg:bottom-1 lg:left-auto lg:right-2 lg:translate-x-0 lg:text-left dark:text-kallos-warm-grey/45">
              Drag to orbit
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.7 }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 lg:bottom-12"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-sans text-[8px] font-light uppercase tracking-[0.45em] text-kallos-warm-grey/50 dark:text-kallos-warm-grey/40">
            Scroll
          </span>
          {!reduceMotion ? (
            <motion.div
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="h-11 w-px origin-top bg-linear-to-b from-kallos-charcoal/25 to-transparent dark:from-kallos-ivory/20"
            />
          ) : (
            <div className="h-11 w-px bg-kallos-warm-grey/25" />
          )}
        </div>
      </motion.div>
    </section>
  );
}
