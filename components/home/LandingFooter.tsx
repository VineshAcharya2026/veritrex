import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FOOTER_LINKS } from "@/components/home/landingContent";
import { BRAND } from "@/lib/brand";
import { LogoWordmark } from "@/components/ui/Logo";

export function LandingFooter() {
  return (
    <footer>
      <div id="contact" className="border-t border-landing-teal/10 bg-white py-12">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-3">
          <div>
            <LogoWordmark height={40} />
            <p className="mt-3 text-sm text-muted">{FOOTER_LINKS.contact.tagline}</p>
            <p className="mt-2 text-sm text-muted">{BRAND.website.replace("https://", "")}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-landing-navy">
              Quick links
            </h3>
            <ul className="mt-4 space-y-2">
              {FOOTER_LINKS.quick.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-landing-teal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-landing-navy">
              Get in touch
            </h3>
            <div className="mt-4 space-y-3">
              <a
                href={`mailto:${FOOTER_LINKS.contact.email}`}
                className="flex items-start gap-2 text-sm text-muted transition-colors hover:text-landing-teal"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-landing-teal" />
                {FOOTER_LINKS.contact.email}
              </a>
              <a
                href={FOOTER_LINKS.contact.phoneHref}
                className="flex items-start gap-2 text-sm text-muted transition-colors hover:text-landing-teal"
              >
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-landing-teal" />
                {FOOTER_LINKS.contact.phone}
              </a>
              <p className="flex items-start gap-2 text-sm text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-landing-gold" />
                {FOOTER_LINKS.contact.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs leading-relaxed text-white/70">
            {BRAND.name} is the structural foundation for verified connection, legacy building, and
            accelerated growth. {BRAND.tagline}
          </p>
          <p className="mt-4 text-center text-xs text-white/50">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved. · {BRAND.city}
          </p>
        </div>
      </div>
    </footer>
  );
}
