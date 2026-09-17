"use client";

import Link from "next/link";
import { NAV_LINKS } from "@/components/home/landingContent";
import { LogoNav } from "@/components/ui/Logo";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black shadow-subtle">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16">
        <Link href="/" className="flex shrink-0 items-center">
          <LogoNav height={34} priority />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/75 transition-colors hover:text-landing-teal"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/register"
            className="hidden rounded-md border-2 border-landing-teal px-4 py-2 text-sm font-semibold text-landing-teal transition-all hover:bg-landing-teal/10 sm:inline-block"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-landing-gold px-4 py-2 text-sm font-semibold text-black shadow-subtle transition-all hover:bg-landing-goldDark"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
