"use client";

import { HeroSection } from "./sections/HeroSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { CTASection } from "./sections/CTASection";
import { FullBleed } from "@/shared/ui/layout/full-bleed/FullBleed";

export function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <FullBleed>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-400/15" />
        <div className="absolute bottom-0 right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-300/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white dark:to-slate-950" />
      </div>
        </FullBleed>

      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-8">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
    </div>
  );
}
