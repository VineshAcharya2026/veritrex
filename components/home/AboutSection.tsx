import { BRAND, BRAND_ABOUT } from "@/lib/brand";

const BLOCKS = [
  { title: "Our mission", body: BRAND_ABOUT.intro },
  { title: "Mentor-Mentee Marketplace", body: BRAND_ABOUT.marketplace },
  { title: "Absolute credibility", body: BRAND_ABOUT.credibility },
  { title: "Referral Hiring", body: BRAND_ABOUT.referralHiring },
  { title: "Professional Credibility Engine", body: BRAND_ABOUT.credibilityEngine },
] as const;

export function AboutSection() {
  return (
    <section id="about" className="landing-section-alt py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-landing-teal">
            About {BRAND.name}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-landing-navy md:text-3xl">
            The structural foundation for verified connection
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">{BRAND_ABOUT.closing}</p>
          <p className="mt-3 text-lg font-semibold text-landing-teal">{BRAND.tagline}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {BLOCKS.map((block) => (
            <article
              key={block.title}
              className="rounded-xl border border-landing-teal/15 bg-white p-6 shadow-card"
            >
              <h3 className="text-lg font-bold text-landing-navy">{block.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{block.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
