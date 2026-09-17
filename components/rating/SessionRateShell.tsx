"use client";

import { SocialDashboardShell } from "@/components/layout/SocialDashboardShell";
import { mentorNav, menteeNav } from "@/lib/nav";

export function SessionRateShell({
  role,
  children,
}: {
  role: "MENTOR" | "MENTEE";
  children: React.ReactNode;
}) {
  const navItems = role === "MENTOR" ? mentorNav : menteeNav;

  return (
    <SocialDashboardShell navItems={navItems}>{children}</SocialDashboardShell>
  );
}
