"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type MentorProgramApp = {
  id: string;
  status: string;
  whyJoin: string | null;
  whatYouBring: string | null;
  nationBuildingCommit: string | null;
  thoughtLeadershipRefs: string | null;
  submittedAt: string | null;
  mentor: {
    user: { profile?: { firstName: string; lastName: string }; email: string };
  };
};

type CommunityApp = {
  id: string;
  reviewStatus: string | null;
  submittedAt: string | null;
  introduction: string | null;
  dreamMission: string | null;
  user: {
    id: string;
    email: string;
    role: string;
    profile?: { firstName: string; lastName: string } | null;
  };
};

type Tab = "community" | "mentor-program";

export default function AdminInnerCirclePage() {
  const [tab, setTab] = useState<Tab>("community");
  const [mentorApps, setMentorApps] = useState<MentorProgramApp[]>([]);
  const [communityApps, setCommunityApps] = useState<CommunityApp[]>([]);
  const [error, setError] = useState("");

  function loadMentor() {
    fetch("/api/admin/inner-circle")
      .then((r) => r.json())
      .then((data) => setMentorApps(Array.isArray(data) ? data : []));
  }

  function loadCommunity() {
    fetch("/api/admin/member-inner-circle")
      .then((r) => r.json())
      .then((data) => setCommunityApps(Array.isArray(data) ? data : []));
  }

  useEffect(() => {
    loadMentor();
    loadCommunity();
  }, []);

  async function reviewMentor(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/admin/inner-circle/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setError("Failed to update mentor program application");
    else loadMentor();
  }

  async function reviewCommunity(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/admin/member-inner-circle/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setError("Failed to update community application");
    else loadCommunity();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inner Circle"
        description="Review mentor program applications and community Inner Circle questionnaires."
      />
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-2 border-b border-primary/10 pb-2">
        <button
          type="button"
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium",
            tab === "community" ? "bg-accent text-white" : "text-muted hover:bg-primary/5"
          )}
          onClick={() => setTab("community")}
        >
          Community applications
        </button>
        <button
          type="button"
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium",
            tab === "mentor-program" ? "bg-accent text-white" : "text-muted hover:bg-primary/5"
          )}
          onClick={() => setTab("mentor-program")}
        >
          Mentor program
        </button>
      </div>

      {tab === "community" && (
        <div className="space-y-4">
          {communityApps.length === 0 && (
            <p className="text-sm text-muted">No community applications submitted yet.</p>
          )}
          {communityApps.map((app) => {
            const name = app.user.profile
              ? `${app.user.profile.firstName} ${app.user.profile.lastName}`
              : app.user.email;
            return (
              <div
                key={app.id}
                className="space-y-3 rounded-xl border border-primary/8 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-primary">{name}</h3>
                    <p className="text-xs text-muted">
                      {app.user.role}
                      {app.submittedAt &&
                        ` · Submitted ${new Date(app.submittedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge>{app.reviewStatus ?? "DRAFT"}</Badge>
                </div>
                {app.introduction && (
                  <p className="line-clamp-3 text-sm text-primary/70">{app.introduction}</p>
                )}
                {app.dreamMission && (
                  <p className="text-sm">
                    <span className="font-medium">Dream / mission:</span> {app.dreamMission}
                  </p>
                )}
                <Link
                  href={`/${app.user.role === "MENTOR" ? "mentor" : "mentee"}/${app.user.id}`}
                  className="text-xs text-accent hover:underline"
                >
                  View public profile
                </Link>
                {app.reviewStatus === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="accent" onClick={() => reviewCommunity(app.id, "APPROVED")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reviewCommunity(app.id, "REJECTED")}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "mentor-program" && (
        <div className="space-y-4">
          {mentorApps.length === 0 && (
            <p className="text-sm text-muted">No mentor program applications yet.</p>
          )}
          {mentorApps.map((app) => {
            const name = app.mentor.user.profile
              ? `${app.mentor.user.profile.firstName} ${app.mentor.user.profile.lastName}`
              : app.mentor.user.email;
            return (
              <div
                key={app.id}
                className="space-y-3 rounded-xl border border-primary/8 bg-white p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-primary">{name}</h3>
                  <Badge>{app.status}</Badge>
                </div>
                {app.whyJoin && (
                  <p className="text-sm">
                    <span className="font-medium">Why join:</span> {app.whyJoin}
                  </p>
                )}
                {app.whatYouBring && (
                  <p className="text-sm">
                    <span className="font-medium">Brings:</span> {app.whatYouBring}
                  </p>
                )}
                {app.nationBuildingCommit && (
                  <p className="text-sm">
                    <span className="font-medium">Nation building:</span> {app.nationBuildingCommit}
                  </p>
                )}
                {app.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="accent" onClick={() => reviewMentor(app.id, "APPROVED")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reviewMentor(app.id, "REJECTED")}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
