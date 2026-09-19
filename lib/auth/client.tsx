"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Role, UserStatus } from "@/lib/db/types";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  name?: string | null;
}

interface SessionContextValue {
  data: { user: SessionUser } | null;
  status: "loading" | "authenticated" | "unauthenticated";
  refresh: () => Promise<void>;
  signOut: (options?: { callbackUrl?: string }) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
  refresh: async () => {},
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ user: SessionUser } | null>(null);
  const [status, setStatus] = useState<SessionContextValue["status"]>("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setData(null);
        setStatus("unauthenticated");
        return;
      }
      const session = await res.json();
      if (session?.user) {
        setData({ user: session.user });
        setStatus("authenticated");
      } else {
        setData(null);
        setStatus("unauthenticated");
      }
    } catch {
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(
    async (options?: { callbackUrl?: string }) => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setData(null);
      setStatus("unauthenticated");
      if (options?.callbackUrl) {
        window.location.href = options.callbackUrl;
      }
    },
    []
  );

  const value = useMemo(
    () => ({ data, status, refresh, signOut }),
    [data, status, refresh, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  return {
    data: ctx.data,
    status: ctx.status,
    update: ctx.refresh,
    refresh: ctx.refresh,
  };
}

export function signOut(options?: { callbackUrl?: string }) {
  return fetch("/api/auth/logout", { method: "POST", credentials: "include" }).then(() => {
    if (options?.callbackUrl) window.location.href = options.callbackUrl;
  });
}
