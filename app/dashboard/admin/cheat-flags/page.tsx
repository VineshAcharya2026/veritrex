"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type Flag = {
  id: string;
  mentorUserId: string;
  menteeUserId: string;
  mentorName: string;
  menteeName: string;
  reason: string;
  pairAvgScore: number | null;
  othersAvgScore: number | null;
  sessionCount: number | null;
  reviewed: boolean;
  adminNotes: string | null;
  createdAt: string;
};

export default function CheatFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");

  function load() {
    fetch("/api/admin/cheat-flags")
      .then((r) => r.json())
      .then((data) => setFlags(Array.isArray(data) ? data : []));
  }

  useEffect(() => { load(); }, []);

  async function markReviewed(id: string) {
    const res = await fetch(`/api/admin/cheat-flags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewed: true, adminNotes: notes[id] || "" }),
    });
    if (res.ok) {
      setSaved(id);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cheat Flag Review"
        description="Pairs flagged for suspiciously high mutual ratings."
      />

      {flags.length === 0 && (
        <p className="text-sm text-muted">No flags to review.</p>
      )}

      {flags.map((f) => (
        <div key={f.id} className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-primary">
                {f.mentorName} &harr; {f.menteeName}
              </p>
              <p className="text-sm text-muted">{f.reason}</p>
              <p className="mt-1 text-xs text-muted">
                Sessions: {f.sessionCount ?? "?"} | Pair avg: {f.pairAvgScore?.toFixed(2) ?? "?"} | Others avg: {f.othersAvgScore?.toFixed(2) ?? "?"}
              </p>
            </div>
            <Badge className={f.reviewed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
              {f.reviewed ? "Reviewed" : "Pending"}
            </Badge>
          </div>

          {!f.reviewed && (
            <div className="space-y-2">
              <Textarea
                placeholder="Admin notes..."
                value={notes[f.id] || ""}
                onChange={(e) => setNotes({ ...notes, [f.id]: e.target.value })}
                rows={2}
              />
              <Button size="sm" variant="accent" onClick={() => markReviewed(f.id)}>
                Mark as reviewed
              </Button>
            </div>
          )}

          {f.reviewed && f.adminNotes && (
            <p className="text-sm text-muted">Notes: {f.adminNotes}</p>
          )}

          {saved === f.id && <Alert variant="success">Saved.</Alert>}
        </div>
      ))}
    </div>
  );
}
