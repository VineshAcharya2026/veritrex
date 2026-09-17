"use client";



import { Suspense, useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";

import {

  AdvancedFilterBar,

  emptyFilters,

  filtersToParams,

  type AdvancedFilterValues,

} from "@/components/layout/AdvancedFilterBar";

import { Button } from "@/components/ui/button";

import { Alert } from "@/components/ui/alert";

import { EntityCardGrid } from "@/components/layout/OverviewHeader";

import { MentorProfileCard } from "@/components/profile/MentorProfileCard";

import { formatApiError } from "@/lib/api-errors";



type Mentor = {

  id: string;

  name: string;

  email: string;

  avatar?: string | null;

  tier?: string;

  profile?: {

    company?: string | null;

    title?: string | null;

    professionalHeadline?: string | null;

    city?: string | null;

    industry?: string | null;

    expertise: string[];

    yearsExp?: number | null;

    maxMentees?: number | null;

    isEliteFounder100?: boolean;

  } | null;

  activeMentees: number;

};



export default function MenteeMentorsPage() {

  return (

    <Suspense fallback={<p className="text-muted">Loading...</p>}>

      <MenteeMentorsContent />

    </Suspense>

  );

}



function MenteeMentorsContent() {

  const searchParams = useSearchParams();

  const requestMentorId = searchParams.get("request");

  const [mentors, setMentors] = useState<Mentor[]>([]);

  const [filters, setFilters] = useState<AdvancedFilterValues>(emptyFilters);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [messageVariant, setMessageVariant] = useState<"info" | "error">("info");

  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const [requestingId, setRequestingId] = useState<string | null>(null);

  const [onboardingComplete, setOnboardingComplete] = useState(true);



  useEffect(() => {

    fetch("/api/mentee/profile")

      .then((r) => r.json())

      .then((p) => setOnboardingComplete(Boolean(p?.onboardingComplete)))

      .catch(() => setOnboardingComplete(true));

  }, []);



  useEffect(() => {

    fetch("/api/mentee/mentorships")

      .then((r) => r.json())

      .then((rows) => {

        if (Array.isArray(rows)) {

          setRequestedIds(new Set(rows.map((m: { mentorId: string }) => m.mentorId)));

        }

      })

      .catch(() => {});

  }, []);



  const load = useCallback(() => {

    setLoading(true);

    const params = filtersToParams(filters);

    fetch(`/api/mentee/mentors?${params.toString()}`)

      .then((r) => r.json())

      .then((data) => setMentors(Array.isArray(data) ? data : []))

      .finally(() => setLoading(false));

  }, [filters]);



  useEffect(() => {

    load();

  }, [load]);



  useEffect(() => {

    if (requestMentorId) {

      setMessage("Use Request mentorship on the highlighted card to connect with this mentor.");

      setMessageVariant("info");

    }

  }, [requestMentorId]);



  async function requestMentor(mentorId: string) {

    setRequestingId(mentorId);

    setMessage("");

    const res = await fetch("/api/mentee/mentorships", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ mentorId }),

    });

    const data = await res.json();

    setRequestingId(null);

    if (res.ok) {

      setRequestedIds((prev) => new Set(prev).add(mentorId));

      setMessage("Request sent! Track it under My Mentorships.");

      setMessageVariant("info");

    } else {

      setMessage(formatApiError(data.error, "Request failed"));

      setMessageVariant("error");

    }

  }



  const ordered = [...mentors].sort((a, b) => {

    if (a.id === requestMentorId) return -1;

    if (b.id === requestMentorId) return 1;

    return 0;

  });



  return (

    <div className="space-y-6">

      <PageHeader title="Find mentors" description="Filter by company and skills to find the right guide." />



      {!onboardingComplete && (

        <Alert variant="info">

          Browse freely, but you&apos;ll need to{" "}

          <Link href="/dashboard/mentee/onboarding" className="font-medium underline">

            complete your onboarding profile

          </Link>{" "}

          before you can request a mentor.

        </Alert>

      )}



      {message && <Alert variant={messageVariant}>{message}</Alert>}



      <AdvancedFilterBar

        values={filters}

        onChange={setFilters}

        onApply={load}

        onClear={() => {

          setFilters(emptyFilters);

          setTimeout(load, 0);

        }}

        searchPlaceholder="Search mentors by name, company, skills..."

        showBounty={false}

      />



      {loading ? (

        <p className="text-muted">Loading...</p>

      ) : ordered.length === 0 ? (

        <Alert variant="info">No mentors match your filters.</Alert>

      ) : (

        <EntityCardGrid>

          {ordered.map((m) => {

            const requested = requestedIds.has(m.id);

            const busy = requestingId === m.id;

            return (

              <div

                key={m.id}

                className={

                  m.id === requestMentorId

                    ? "rounded-xl ring-2 ring-accent ring-offset-2"

                    : undefined

                }

              >

                <MentorProfileCard

                  mentor={{

                    userId: m.id,

                    name: m.name,

                    avatar: m.avatar,

                    title: m.profile?.title,

                    company: m.profile?.company,

                    headline: m.profile?.professionalHeadline,

                    city: m.profile?.city,

                    industry: m.profile?.industry,

                    expertise: m.profile?.expertise ?? [],

                    tier: m.tier,

                    isEliteFounder100: m.profile?.isEliteFounder100,

                  }}

                  cta={

                    <Button

                      size="sm"

                      variant="accent"

                      disabled={requested || busy || !onboardingComplete}

                      onClick={() => requestMentor(m.id)}

                    >

                      {busy

                        ? "Sending…"

                        : requested

                          ? "Requested"

                          : !onboardingComplete

                            ? "Complete profile to request"

                            : "Request mentorship"}

                    </Button>

                  }

                />

              </div>

            );

          })}

        </EntityCardGrid>

      )}

    </div>

  );

}

