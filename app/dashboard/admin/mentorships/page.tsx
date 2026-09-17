"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";

type Mentorship = {
  id: string;
  status: string;
  message?: string;
  mentorId: string;
  menteeId: string;
  mentor: { id: string; email: string; profile?: { firstName: string; lastName: string }; mentorProfile?: { company?: string; title?: string } };
  mentee: { id: string; email: string; profile?: { firstName: string; lastName: string } };
};

export default function AdminMentorshipsPage() {
  const [items, setItems] = useState<Mentorship[]>([]);

  useEffect(() => {
    fetch("/api/admin/mentorships").then((r) => r.json()).then(setItems);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Mentorships" description="All mentor–mentee pairings on the platform." />
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-primary">
                  <Link
                    href={`/dashboard/admin/users/${m.mentorId || m.mentor.id}`}
                    className="hover:underline"
                  >
                    {m.mentor.profile ? `${m.mentor.profile.firstName} ${m.mentor.profile.lastName}` : m.mentor.email}
                  </Link>
                  {" → "}
                  <Link
                    href={`/dashboard/admin/users/${m.menteeId || m.mentee.id}`}
                    className="hover:underline"
                  >
                    {m.mentee.profile ? `${m.mentee.profile.firstName} ${m.mentee.profile.lastName}` : m.mentee.email}
                  </Link>
                </p>
                {m.mentor.mentorProfile?.company && (
                  <p className="text-sm text-muted">{m.mentor.mentorProfile.company}</p>
                )}
              </div>
              <Badge variant="accent">{m.status}</Badge>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-muted">No mentorships yet.</p>}
      </div>
    </div>
  );
}
