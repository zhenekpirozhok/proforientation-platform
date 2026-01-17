'use client';

import { HeroSection } from './sections/HeroSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { CTASection } from './sections/CTASection';
import { FullBleed } from '@/shared/ui/layout/full-bleed/FullBleed';

export function LandingPage() {
  return (
    <section className="relative overflow-x-clip bg-white dark:bg-slate-950">
      <FullBleed>
        <div className="absolute inset-0 bg-white dark:bg-slate-950" />
        <div className="absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-400/15" />
          <div className="absolute bottom-0 -right-30 h-105 w-105 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-300/10" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white dark:to-slate-950" />
        </div>
      </FullBleed>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </div>
    </section>
  );
}
