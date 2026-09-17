"use client";

import { useState } from "react";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardShell({
  children,
  navItems,
  title,
  breadcrumbs,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar items={navItems} title={title} />
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-white/10 bg-black shadow-card-hover animate-fade-in">
            <nav className="space-y-1 p-4 pt-20">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-landing-teal text-black"
                        : "text-white/70 hover:bg-white/5 hover:text-landing-teal"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} breadcrumbs={breadcrumbs} />
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
