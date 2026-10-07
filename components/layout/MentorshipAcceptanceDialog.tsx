"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isMentorshipAcceptedNotification } from "@/lib/notification-types";
import { useNotifications } from "@/components/layout/useNotifications";

const SEEN_KEY = "mentorship-announcement-seen";

function loadSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveSeenId(id: string) {
  const seen = loadSeenIds();
  seen.add(id);
  const list = [...seen].slice(-100);
  sessionStorage.setItem(SEEN_KEY, JSON.stringify(list));
}

export function MentorshipAcceptanceDialog() {
  const { data: session } = useSession();
  const { notifications, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (session?.user?.role !== "MENTEE") return;

    const seen = loadSeenIds();
    const candidate = notifications.find(
      (n) =>
        !n.read &&
        !seen.has(n.id) &&
        isMentorshipAcceptedNotification(n.type, n.message)
    );

    if (!candidate || activeIdRef.current === candidate.id) return;

    activeIdRef.current = candidate.id;
    setMessage(candidate.message);
    setOpen(true);
    saveSeenId(candidate.id);
    void markAsRead(candidate.id);
  }, [notifications, session?.user?.role, markAsRead]);

  if (session?.user?.role !== "MENTEE") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <GraduationCap className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Mentorship request accepted</DialogTitle>
          <DialogDescription className="text-center">
            {message ||
              "Your mentor accepted your request. You can continue with your learning."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button variant="accent" asChild onClick={() => setOpen(false)}>
            <Link href="/dashboard/mentee/mentorships">Continue learning</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
