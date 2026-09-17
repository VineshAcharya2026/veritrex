"use client";

import { useState } from "react";
import { ROLE_PLANS, getRolePlan, type RolePlan, type RolePlanId } from "@/components/home/rolePlans";
import { RolePlanCard } from "@/components/home/RolePlanCard";
import { RolePlanModal } from "@/components/home/RolePlanModal";

export function RolePlanSection() {
  const [open, setOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<RolePlan | null>(null);

  function handleOpen(id: RolePlanId) {
    const plan = getRolePlan(id);
    if (!plan) return;
    setActivePlan(plan);
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      window.setTimeout(() => setActivePlan(null), 200);
    }
  }

  return (
    <section id="plans" className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center animate-fade-in">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-landing-teal">
            Choose your path
          </p>
          <h2 className="text-3xl font-bold text-landing-navy md:text-4xl">
            One platform.{" "}
            <span className="text-landing-teal">Two ways to grow.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Click a role to see full details — then join in minutes.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {ROLE_PLANS.map((plan, index) => (
            <RolePlanCard
              key={plan.id}
              plan={plan}
              index={index}
              onOpen={handleOpen}
            />
          ))}
        </div>

        <RolePlanModal plan={activePlan} open={open} onOpenChange={handleOpenChange} />
      </div>
    </section>
  );
}
