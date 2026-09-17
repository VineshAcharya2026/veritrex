"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RolePlan } from "@/components/home/rolePlans";

const THEME_CLASSES = {
  teal: {
    chipBg: "bg-landing-tealLight ring-1 ring-landing-teal/25",
    icon: "text-landing-teal",
    badge: "bg-landing-tealLight text-landing-teal",
    check: "text-landing-teal",
    step: "bg-landing-teal text-white",
    cta: "bg-landing-teal text-white hover:bg-landing-tealDark",
  },
  gold: {
    chipBg: "bg-landing-goldLight ring-1 ring-landing-gold/30",
    icon: "text-landing-goldDark",
    badge: "bg-landing-goldLight text-landing-goldDark",
    check: "text-landing-goldDark",
    step: "bg-landing-gold text-landing-navy",
    cta: "bg-landing-gold text-landing-navy hover:bg-landing-goldDark",
  },
} as const;

export function RolePlanModal({
  plan,
  open,
  onOpenChange,
}: {
  plan: RolePlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!plan) return null;

  const Icon = plan.icon;
  const theme = THEME_CLASSES[plan.theme];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6">
        <div className="relative">
          <div
            className={`absolute inset-x-0 -top-8 h-1.5 rounded-t-xl bg-gradient-to-r ${plan.accentClass}`}
            aria-hidden
          />

          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", theme.chipBg)}>
                <Icon className={cn("h-5 w-5", theme.icon)} />
              </div>
              <Badge className={theme.badge}>{plan.title}</Badge>
            </div>
            <DialogTitle className="text-2xl leading-snug text-landing-navy">
              {plan.headline}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {plan.summary}
            </DialogDescription>
          </DialogHeader>

          <section className="mt-6 space-y-5">
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-landing-navy">
                What you get
              </h4>
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm text-muted">
                    <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", theme.check)} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-landing-navy">
                How it works
              </h4>
              <ol className="space-y-3">
                {plan.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-muted">
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", theme.step)}>
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <DialogFooter className="mt-6 gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button asChild className={theme.cta}>
              <Link href={`/register?role=${plan.id}`}>Join as {plan.title}</Link>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
