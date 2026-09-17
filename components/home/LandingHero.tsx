import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LogoMark } from "@/components/ui/Logo";

export function LandingHero() {
  return (
    <section className="landing-hero-gradient relative overflow-hidden pb-16 pt-12 md:pb-24 md:pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
        <div className="animate-fade-in text-center md:text-left">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-landing-gold">
            {BRAND.tagline}
          </p>
          <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
            The world&apos;s most trusted ecosystem for{" "}
            <span className="underline decoration-landing-gold/60 decoration-2 underline-offset-4">
              mentorship &amp; career advancement
            </span>
          </h1>
          <p className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-base font-bold text-landing-navy shadow-lg md:text-lg">
            Institutional-grade validation for every professional
          </p>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/90 md:text-base">
            {BRAND.aboutShort}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link
              href="#get-started"
              className="rounded-md bg-landing-gold px-6 py-3 text-sm font-bold text-landing-navy shadow-lg transition-all hover:scale-[1.02] hover:brightness-105 hover:shadow-xl"
            >
              Start now
            </Link>
            <Link
              href="#about"
              className="rounded-md border-2 border-white/80 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              About {BRAND.name}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm md:h-80 md:w-80">
          <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-2xl md:h-48 md:w-48">
            <LogoMark size={104} rounded="rounded-2xl" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
