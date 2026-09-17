"use client";

import { SocialDashboardShell } from "@/components/layout/SocialDashboardShell";
import { SocialPageFrame } from "@/components/layout/SocialPageFrame";
import { mentorNav } from "@/lib/nav";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocialDashboardShell navItems={mentorNav}>
      <SocialPageFrame role="MENTOR">{children}</SocialPageFrame>
    </SocialDashboardShell>
  );
}
