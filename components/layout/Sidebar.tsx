"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { LogoWordmark } from "@/components/ui/Logo";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function Sidebar({ items, title }: { items: NavItem[]; title: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-white/10 bg-black lg:flex">
      <div className="flex flex-col justify-center gap-1 border-b border-white/10 px-4 py-3">
        <LogoWordmark height={32} priority />
        <p className="pl-0.5 text-[10px] font-medium uppercase tracking-widest text-landing-teal">
          {title}
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-landing-teal text-black shadow-card"
                  : "text-white/70 hover:bg-white/5 hover:text-landing-teal"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-black")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="text-center text-[10px] text-white/40">Mentorship platform</p>
      </div>
    </aside>
  );
}
