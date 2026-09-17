"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { CATEGORY_LABELS } from "@/lib/nation-building";
import type { NationBuildingCategory } from "@/lib/db/types";

type Outcome = {
  id: string;
  outcomeType: string;
  city: string | null;
  industry: string | null;
  notes: string | null;
  mentorship: {
    mentor: { profile?: { firstName: string; lastName: string } };
    mentee: { profile?: { firstName: string; lastName: string } };
  };
};

type NationBuildingEntry = {
  id: string;
  category: NationBuildingCategory;
  title: string;
  description: string | null;
  quantity: number;
  location: string | null;
  testimonial: string | null;
  evidenceUrls: string[];
  mentor: { profile?: { firstName: string; lastName: string } };
};

export default function AdminOutcomesPage() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [entries, setEntries] = useState<NationBuildingEntry[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/outcomes")
      .then((r) => r.json())
      .then((data) => setOutcomes(Array.isArray(data) ? data : []));
    fetch("/api/admin/nation-building/entries")
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function verifyOutcome(id: string, verified: boolean) {
    const res = await fetch(`/api/admin/outcomes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified }),
    });
    if (!res.ok) {
      setError("Failed to update outcome");
      return;
    }
    load();
  }

  async function verifyEntry(id: string, verified: boolean) {
    const res = await fetch(`/api/admin/nation-building/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified, adminNotes: notes[id] || undefined }),
    });
    if (!res.ok) {
      setError("Failed to update contribution");
      return;
    }
    load();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Impact Score verification"
        description="Verify mentor-reported contributions and impact outcomes. Verified items grow the mentor's Impact Score and award badges."
      />
      {error && <Alert variant="error">{error}</Alert>}

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Contributions ({entries.length})</h2>
        {entries.length === 0 && (
          <p className="text-sm text-muted">No pending contributions to verify.</p>
        )}
        {entries.map((entry) => {
          const mentor = entry.mentor.profile
            ? `${entry.mentor.profile.firstName} ${entry.mentor.profile.lastName}`
            : "Mentor";
          return (
            <div key={entry.id} className="space-y-2 rounded-xl border border-primary/8 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-primary">
                  {mentor} · {entry.title}
                </p>
                <Badge>{CATEGORY_LABELS[entry.category]}</Badge>
              </div>
              <p className="text-sm text-muted">
                Quantity: {entry.quantity}
                {entry.location ? ` · ${entry.location}` : ""}
              </p>
              {entry.description && <p className="text-sm">{entry.description}</p>}
              {entry.testimonial && (
                <p className="text-sm italic text-primary/80">“{entry.testimonial}”</p>
              )}
              {entry.evidenceUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {entry.evidenceUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent underline"
                    >
                      Evidence
                    </a>
                  ))}
                </div>
              )}
              <input
                value={notes[entry.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [entry.id]: e.target.value }))}
                placeholder="Admin notes (optional)"
                className="mt-1 h-9 w-full rounded-sm border border-primary/15 bg-white px-3 text-sm"
              />
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="accent" onClick={() => verifyEntry(entry.id, true)}>
                  Verify
                </Button>
                <Button size="sm" variant="outline" onClick={() => verifyEntry(entry.id, false)}>
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Legacy mentee outcomes ({outcomes.length})</h2>
        {outcomes.length === 0 && (
          <p className="text-sm text-muted">No pending outcomes to verify.</p>
        )}
        {outcomes.map((o) => {
          const mentor = o.mentorship.mentor.profile
            ? `${o.mentorship.mentor.profile.firstName} ${o.mentorship.mentor.profile.lastName}`
            : "Mentor";
          const mentee = o.mentorship.mentee.profile
            ? `${o.mentorship.mentee.profile.firstName} ${o.mentorship.mentee.profile.lastName}`
            : "Mentee";
          return (
            <div key={o.id} className="space-y-2 rounded-xl border border-primary/8 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-medium text-primary">
                  {mentor} → {mentee}
                </p>
                <Badge>{o.outcomeType.replace(/_/g, " ")}</Badge>
              </div>
              {(o.city || o.industry) && (
                <p className="text-sm text-muted">{[o.city, o.industry].filter(Boolean).join(" · ")}</p>
              )}
              {o.notes && <p className="text-sm">{o.notes}</p>}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="accent" onClick={() => verifyOutcome(o.id, true)}>
                  Verify
                </Button>
                <Button size="sm" variant="outline" onClick={() => verifyOutcome(o.id, false)}>
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
