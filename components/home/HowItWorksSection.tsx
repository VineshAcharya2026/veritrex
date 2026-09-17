import { HOW_IT_WORKS_STEPS } from "@/components/home/landingContent";
import { BRAND } from "@/lib/brand";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-landing-navy md:text-3xl">
          How <span className="text-landing-teal">{BRAND.name} works</span>
        </h2>

        <div className="relative mx-auto mt-14 max-w-4xl">
          <div
            className="absolute left-0 right-0 top-8 hidden h-0.5 border-t-2 border-dashed border-landing-teal/40 md:block"
            aria-hidden
          />

          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {HOW_IT_WORKS_STEPS.map((item, index) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div
                  className={
                    "relative z-10 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold shadow-lg " +
                    (index === HOW_IT_WORKS_STEPS.length - 1
                      ? "bg-landing-gold text-landing-navy ring-4 ring-landing-goldLight"
                      : "bg-landing-teal text-white ring-4 ring-landing-tealLight")
                  }
                >
                  {item.step}
                </div>
                <h3 className="mt-5 text-base font-bold text-landing-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
