"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth/client";
import Link from "next/link";
import { Bell, CheckCheck, GraduationCap, UserCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
};

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

function getNotificationHref(type: string, role?: string): string | null {
  switch (type) {
    case "MENTORSHIP":
      if (role === "MENTOR") return "/dashboard/mentor/mentees";
      if (role === "MENTEE") return "/dashboard/mentee/mentors";
      if (role === "SUPER_ADMIN") return "/dashboard/admin/mentorships";
      return null;
    case "ACCOUNT":
      if (role === "SUPER_ADMIN") return "/dashboard/admin";
      if (role === "MENTOR") return "/dashboard/mentor";
      if (role === "MENTEE") return "/dashboard/mentee";
      return null;
    case "SESSION_NO_SHOW":
    case "RATING":
    case "RATING_REMINDER":
      if (role === "MENTOR") return "/dashboard/mentor/ratings";
      if (role === "MENTEE") return "/dashboard/mentee/ratings";
      if (role === "SUPER_ADMIN") return "/dashboard/admin/ratings";
      return null;
    case "STRIKE_WARNING":
      if (role === "SUPER_ADMIN") return "/dashboard/admin/strikes";
      if (role === "MENTOR") return "/dashboard/mentor/ratings";
      if (role === "MENTEE") return "/dashboard/mentee/ratings";
      return null;
    default:
      return null;
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "MENTORSHIP":
      return GraduationCap;
    case "ACCOUNT":
      return UserCheck;
    default:
      return Bell;
  }
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const markAsRead = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    }
  };

  const markAllRead = async () => {
    const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    }
  };

  const role = session?.user?.role;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 transition-all duration-200 hover:bg-surface hover:shadow-subtle"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5 text-primary" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-primary/8 bg-white shadow-card-hover animate-fade-in sm:w-96">
          <div className="flex items-center justify-between border-b border-primary/8 px-4 py-3">
            <h3 className="text-sm font-semibold text-primary">Notifications</h3>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted hover:text-primary"
                onClick={markAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-md bg-primary/5" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-primary/20" />
                <p className="mt-2 text-sm text-muted">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-primary/5">
                {notifications.map((n) => {
                  const Icon = getNotificationIcon(n.type);
                  const href = getNotificationHref(n.type, role);

                  const content = (
                    <>
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          n.read ? "bg-primary/5 text-primary/40" : "bg-accent/15 text-accent"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            n.read ? "text-muted" : "font-medium text-primary"
                          )}
                        >
                          {n.message}
                        </p>
                        <p className="mt-1 text-xs text-muted">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      )}
                    </>
                  );

                  return (
                    <li key={n.id}>
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => {
                            if (!n.read) markAsRead(n.id);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex gap-3 px-4 py-3 transition-colors hover:bg-surface",
                            !n.read && "bg-accent/5"
                          )}
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!n.read) markAsRead(n.id);
                          }}
                          className={cn(
                            "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface",
                            !n.read && "bg-accent/5"
                          )}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
