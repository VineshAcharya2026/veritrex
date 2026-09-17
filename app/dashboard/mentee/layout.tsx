"use client";

import { SocialDashboardShell } from "@/components/layout/SocialDashboardShell";
import { SocialPageFrame } from "@/components/layout/SocialPageFrame";
import { menteeNav } from "@/lib/nav";

export default function MenteeLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocialDashboardShell navItems={menteeNav}>
      <SocialPageFrame role="MENTEE">{children}</SocialPageFrame>
    </SocialDashboardShell>
  );
}
