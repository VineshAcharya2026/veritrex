"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUICK_START_ROLES } from "@/components/home/landingContent";
import type { RolePlanId } from "@/components/home/rolePlans";
import { BRAND } from "@/lib/brand";
import { quickStartSchema } from "@/lib/validators/auth";

export function QuickStartForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RolePlanId>("MENTEE");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = quickStartSchema.safeParse({ name, email });
    if (!parsed.success) {
      const next: { name?: string; email?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name" || key === "email") next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    const params = new URLSearchParams();
    params.set("role", role);
    const parts = parsed.data.name.split(/\s+/);
    params.set("firstName", parts[0] ?? "");
    if (parts.length > 1) params.set("lastName", parts.slice(1).join(" "));
    params.set("email", parsed.data.email);
    router.push(`/register?${params.toString()}`);
  }

  return (
    <section id="get-started" className="landing-section-alt py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-2xl font-bold md:text-3xl">
          <span className="text-landing-navy">Start your </span>
          <span className="text-landing-teal">{BRAND.name} journey</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          Choose mentor or mentee and we&apos;ll take you straight to registration.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto mt-10 max-w-2xl space-y-4 rounded-xl border border-landing-teal/15 bg-white p-6 shadow-card md:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="qs-name" className="text-sm font-medium text-landing-navy">
                Your name
              </label>
              <input
                id="qs-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }
                }}
                placeholder="Full name"
                aria-invalid={Boolean(fieldErrors.name)}
                className="h-11 w-full rounded-md border border-landing-teal/20 px-3 text-sm transition-colors focus:border-landing-teal focus:outline-none focus:ring-2 focus:ring-landing-teal/30 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20"
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="qs-email" className="text-sm font-medium text-landing-navy">
                Your email
              </label>
              <input
                id="qs-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
                placeholder="you@company.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className="h-11 w-full rounded-md border border-landing-teal/20 px-3 text-sm transition-colors focus:border-landing-teal focus:outline-none focus:ring-2 focus:ring-landing-teal/30 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="qs-role" className="text-sm font-medium text-landing-navy">
              I want to join as
            </label>
            <select
              id="qs-role"
              value={role}
              onChange={(e) => setRole(e.target.value as RolePlanId)}
              className="h-11 w-full rounded-md border border-landing-teal/20 bg-white px-3 text-sm focus:border-landing-teal focus:outline-none focus:ring-2 focus:ring-landing-teal/30"
            >
              {QUICK_START_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              className="flex-1 rounded-md bg-landing-teal py-3 text-sm font-bold text-white shadow-subtle transition-all hover:bg-landing-tealDark hover:shadow-card"
            >
              Create account
            </button>
            <a
              href="/login"
              className="flex-1 rounded-md border-2 border-landing-teal py-3 text-center text-sm font-bold text-landing-teal transition-all hover:bg-landing-tealLight"
            >
              Track your mentorships
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}
