"use client";

import { SocialDashboardShell } from "@/components/layout/SocialDashboardShell";
import { SocialPageFrame } from "@/components/layout/SocialPageFrame";
import { mentorNav, menteeNav } from "@/lib/nav";

/** Shared chrome for cross-role dashboard pages (feed, friends, messages). */
export function SocialRoleShell({
  role,
  children,
}: {
  role: "MENTOR" | "MENTEE";
  children: React.ReactNode;
}) {
  const navItems = role === "MENTOR" ? mentorNav : menteeNav;
  return (
    <SocialDashboardShell navItems={navItems}>
      <SocialPageFrame role={role}>{children}</SocialPageFrame>
    </SocialDashboardShell>
  );
}
