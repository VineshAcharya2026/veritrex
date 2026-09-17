"use client";

import { signOut, useSession } from "@/lib/auth/client";
import { Home, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { NotificationBell } from "@/components/layout/NotificationBell";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar({
  onMenuClick,
  breadcrumbs,
}: {
  onMenuClick?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const showHome = role === "MENTOR" || role === "MENTEE";
  const displayName = session?.user?.name || session?.user?.email || "Member";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-black px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-landing-teal lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {showHome && (
          <Link
            href="/dashboard/feed"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-landing-teal"
            aria-label="Home"
            title="Home"
          >
            <Home className="h-5 w-5" />
          </Link>
        )}
        {breadcrumbs && (
          <nav className="flex items-center gap-1.5 text-sm text-white/60">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {b.href ? (
                  <Link href={b.href} className="transition-colors hover:text-landing-teal">
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-medium text-white">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-landing-teal/20 text-xs font-semibold text-landing-teal">
            {initials(displayName)}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-white">{displayName}</p>
            <Badge variant="accent" className="mt-0.5 bg-landing-teal text-black">
              {session?.user?.role}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="border-white/20 text-white transition-all duration-200 hover:bg-white/10 hover:text-landing-teal"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
