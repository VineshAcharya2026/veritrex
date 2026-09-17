"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { ChevronDown, LogOut, Menu, MessageSquare, X } from "lucide-react";

import { signOut, useSession } from "@/lib/auth/client";

import { NotificationBell } from "@/components/layout/NotificationBell";

import { LogoNav, LogoWordmark } from "@/components/ui/Logo";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import type { NavItem } from "@/components/layout/Sidebar";



function initials(name: string) {

  return name

    .split(" ")

    .map((p) => p[0])

    .join("")

    .slice(0, 2)

    .toUpperCase();

}



/** Longest prefix match so /dashboard/mentor/profile highlights Profile, not Workspace. */

function activeNavHref(pathname: string, items: NavItem[]): string | null {

  let best: string | null = null;

  for (const item of items) {

    const matches =

      pathname === item.href || pathname.startsWith(`${item.href}/`);

    if (matches && (!best || item.href.length > best.length)) {

      best = item.href;

    }

  }

  return best;

}



/** LinkedIn-style chrome for mentor & mentee (top nav, soft canvas). Admin keeps DashboardShell. */

export function SocialDashboardShell({

  children,

  navItems,

}: {

  children: React.ReactNode;

  navItems: NavItem[];

}) {

  const pathname = usePathname();

  const { data: session } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [meOpen, setMeOpen] = useState(false);

  const meRef = useRef<HTMLDivElement>(null);

  const displayName = session?.user?.name || session?.user?.email || "Member";

  const isMentor = session?.user?.role === "MENTOR";

  const profileHref = isMentor

    ? "/dashboard/mentor/profile"

    : "/dashboard/mentee/profile";

  const ratingsHref = isMentor

    ? "/dashboard/mentor/ratings"

    : "/dashboard/mentee/ratings";

  const publicProfileHref = session?.user?.id

    ? isMentor

      ? `/mentor/${session.user.id}`

      : `/mentee/${session.user.id}`

    : profileHref;



  const activeHref = useMemo(

    () => activeNavHref(pathname, navItems),

    [pathname, navItems]

  );



  useEffect(() => {

    function onDocClick(e: MouseEvent) {

      if (meRef.current && !meRef.current.contains(e.target as Node)) {

        setMeOpen(false);

      }

    }

    document.addEventListener("mousedown", onDocClick);

    return () => document.removeEventListener("mousedown", onDocClick);

  }, []);



  return (

    <div className="min-h-screen bg-[#eef3f8]">

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black shadow-sm">

        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2 sm:h-16 sm:gap-3 sm:px-4">

          <Button

            variant="ghost"

            size="icon"

            className="shrink-0 text-white/80 hover:bg-white/10 hover:text-landing-teal lg:hidden"

            onClick={() => setMobileOpen(true)}

            aria-label="Open menu"

          >

            <Menu className="h-5 w-5" />

          </Button>



          <Link href="/dashboard/feed" className="flex shrink-0 items-center">
            <LogoNav height={32} priority />
          </Link>



          <nav className="hidden min-w-0 flex-1 items-stretch gap-0 overflow-x-auto lg:flex [&::-webkit-scrollbar]:hidden">

            {navItems.map((item) => {

              const Icon = item.icon;

              const active = activeHref === item.href;

              return (

                <Link

                  key={item.href}

                  href={item.href}

                  title={item.label}

                  className={cn(

                    "group relative flex min-w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors xl:min-w-[56px] xl:px-2.5 xl:text-[11px]",

                    active

                      ? "text-white"

                      : "text-white/60 hover:text-landing-teal"

                  )}

                >

                  <Icon

                    className={cn(

                      "h-5 w-5 shrink-0",

                      active

                        ? "text-landing-teal"

                        : "text-white/60 group-hover:text-landing-teal"

                    )}

                  />

                  <span className="hidden max-w-[72px] truncate xl:inline">

                    {item.label}

                  </span>

                  {active && (

                    <span className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-landing-teal" />

                  )}

                </Link>

              );

            })}

          </nav>



          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">

            <Link

              href="/dashboard/messages"

              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-landing-teal"

              aria-label="Messages"

              title="Messages"

            >

              <MessageSquare className="h-5 w-5" />

            </Link>

            <div className="[&_button]:text-white/80 [&_button:hover]:bg-white/10 [&_button:hover]:text-landing-teal [&_svg]:text-white/80">

              <NotificationBell />

            </div>

            <div className="relative" ref={meRef}>

              <button

                type="button"

                onClick={() => setMeOpen((v) => !v)}

                className="flex items-center gap-1 rounded-full py-1 pl-1 pr-2 text-white/80 hover:bg-white/10"

                aria-expanded={meOpen}

                aria-haspopup="menu"

              >

                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-landing-teal/20 text-xs font-semibold text-landing-teal">

                  {initials(displayName)}

                </span>

                <span className="hidden max-w-[100px] truncate text-xs font-semibold sm:inline">

                  Me

                </span>

                <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />

              </button>

              {meOpen && (

                <div

                  role="menu"

                  className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-primary/10 bg-white py-1 shadow-card-hover"

                >

                  <Link

                    href={publicProfileHref}

                    role="menuitem"

                    className="block px-4 py-2 text-sm text-primary hover:bg-primary/5"

                    onClick={() => setMeOpen(false)}

                  >

                    View profile

                  </Link>

                  <Link

                    href={profileHref}

                    role="menuitem"

                    className="block px-4 py-2 text-sm text-primary hover:bg-primary/5"

                    onClick={() => setMeOpen(false)}

                  >

                    Edit profile

                  </Link>

                  <Link

                    href={ratingsHref}

                    role="menuitem"

                    className="block px-4 py-2 text-sm text-primary hover:bg-primary/5"

                    onClick={() => setMeOpen(false)}

                  >

                    Ratings &amp; Trust

                  </Link>

                  <hr className="my-1 border-primary/10" />

                  <button

                    type="button"

                    role="menuitem"

                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"

                    onClick={() => {

                      setMeOpen(false);

                      signOut({ callbackUrl: "/login" });

                    }}

                  >

                    <LogOut className="h-3.5 w-3.5" />

                    Log out

                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      </header>



      {mobileOpen && (

        <div className="fixed inset-0 z-50 lg:hidden">

          <div

            className="absolute inset-0 bg-black/60 backdrop-blur-sm"

            onClick={() => setMobileOpen(false)}

          />

          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl animate-fade-in">

            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black px-4 py-3">

              <LogoWordmark height={28} priority />

              <Button

                variant="ghost"

                size="icon"

                className="text-white/80 hover:bg-white/10 hover:text-landing-teal"

                onClick={() => setMobileOpen(false)}

                aria-label="Close menu"

              >

                <X className="h-5 w-5" />

              </Button>

            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">

              {navItems.map((item) => {

                const Icon = item.icon;

                const active = activeHref === item.href;

                return (

                  <Link

                    key={item.href}

                    href={item.href}

                    onClick={() => setMobileOpen(false)}

                    className={cn(

                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",

                      active

                        ? "bg-landing-teal/15 text-landing-navy"

                        : "text-slate-600 hover:bg-slate-50"

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



      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 lg:py-6">{children}</main>

    </div>

  );

}


