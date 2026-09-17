"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RolePlan } from "@/components/home/rolePlans";

const THEME_CLASSES = {
  teal: {
    border: "hover:border-landing-teal/40",
    ring: "focus-visible:ring-landing-teal/50",
    chipBg: "bg-landing-tealLight ring-1 ring-landing-teal/20 group-hover:bg-landing-teal/15 group-hover:ring-landing-teal/40",
    icon: "text-landing-teal",
    highlight: "bg-landing-tealLight text-landing-teal group-hover:bg-landing-teal/15",
    cta: "text-landing-teal",
  },
  gold: {
    border: "hover:border-landing-gold/50",
    ring: "focus-visible:ring-landing-gold/50",
    chipBg: "bg-landing-goldLight ring-1 ring-landing-gold/30 group-hover:bg-landing-gold/20 group-hover:ring-landing-gold/50",
    icon: "text-landing-goldDark",
    highlight: "bg-landing-goldLight text-landing-goldDark group-hover:bg-landing-gold/20",
    cta: "text-landing-goldDark",
  },
} as const;

export function RolePlanCard({
  plan,
  index,
  onOpen,
}: {
  plan: RolePlan;
  index: number;
  onOpen: (id: RolePlan["id"]) => void;
}) {
  const Icon = plan.icon;
  const theme = THEME_CLASSES[plan.theme];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(plan.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(plan.id);
        }
      }}
      style={{ animationDelay: `${index * 80}ms` }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border border-landing-teal/15 bg-white p-6 shadow-card opacity-0 animate-fade-in",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:shadow-card-hover",
        theme.border,
        "focus-visible:outline-none focus-visible:ring-2",
        theme.ring
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5 origin-left scale-x-0 bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100",
          plan.accentClass
        )}
      />

      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300",
          theme.chipBg
        )}
      >
        <Icon className={cn("h-6 w-6 transition-transform duration-300 group-hover:scale-110", theme.icon)} />
      </div>

      <h3 className="text-lg font-bold text-landing-navy">{plan.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{plan.summary}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {plan.highlights.map((h) => (
          <li
            key={h}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium transition-colors duration-200",
              theme.highlight
            )}
          >
            {h}
          </li>
        ))}
      </ul>

      <span
        className={cn(
          "mt-5 inline-flex items-center gap-1 text-sm font-semibold opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100",
          theme.cta
        )}
      >
        Learn more
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}
