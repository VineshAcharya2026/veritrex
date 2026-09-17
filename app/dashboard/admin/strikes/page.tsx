"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

type StrikeUser = {
  userId: string;
  name: string;
  role: string;
  strikeCount: number;
  strikes: { reason: string; createdAt: string }[];
};

export default function StrikesPage() {
  const [users, setUsers] = useState<StrikeUser[]>([]);

  useEffect(() => {
    fetch("/api/admin/strikes")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reliability Strikes"
        description="Users with 3 or more strikes in the last 90 days."
      />

      {users.length === 0 && (
        <p className="text-sm text-muted">No flagged users.</p>
      )}

      {users.map((u) => (
        <div key={u.userId} className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/dashboard/admin/users/${u.userId}`}
                className="font-medium text-primary hover:underline"
              >
                {u.name}
              </Link>
              <div className="mt-1">
                <Badge>{u.role}</Badge>
              </div>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {u.strikeCount} strikes
            </span>
          </div>

          <div className="space-y-1">
            {u.strikes.map((s, i) => (
              <div key={i} className="flex justify-between text-xs text-muted">
                <span>{s.reason === "NO_SHOW" ? "No-show" : "Late cancellation"}</span>
                <span>{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
