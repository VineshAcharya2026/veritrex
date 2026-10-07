"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/lib/auth/client";

export type NotificationItem = {
  id: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
};

type NotificationsContextValue = {
  notifications: NotificationItem[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const POLL_MS = 30_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;
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
      fetchingRef.current = false;
    }
  }, [session?.user, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setNotifications([]);
      setUnread(0);
      return;
    }
    void fetchNotifications();
  }, [status, fetchNotifications]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, POLL_MS);
    return () => window.clearInterval(interval);
  }, [status, fetchNotifications]);

  useEffect(() => {
    if (status !== "authenticated") return;
    function onVisibility() {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [status, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unread,
        loading,
        refresh: fetchNotifications,
        markAsRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
