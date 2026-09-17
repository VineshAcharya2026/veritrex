import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession, dashboardPathForRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionRatingFlow } from "@/components/rating/SessionRatingFlow";
import { SessionRateShell } from "@/components/rating/SessionRateShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function SessionRatePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const auth = await getSession();
  if (!auth) redirect("/login");

  const { sessionId } = await params;

  const mentorshipSession = await prisma.mentorshipSession.findUnique({
    where: { id: sessionId },
    include: {
      mentorship: {
        include: {
          mentor: { include: { profile: true } },
          mentee: { include: { profile: true } },
        },
      },
    },
  });

  if (!mentorshipSession) notFound();

  const { mentorship } = mentorshipSession;
  const isMentor = auth.user.id === mentorship.mentorId;
  const isMentee = auth.user.id === mentorship.menteeId;

  if (!isMentor && !isMentee) redirect(dashboardPathForRole(auth.user.role));

  const mentorName = mentorship.mentor.profile
    ? `${mentorship.mentor.profile.firstName} ${mentorship.mentor.profile.lastName}`
    : "Mentor";
  const menteeName = mentorship.mentee.profile
    ? `${mentorship.mentee.profile.firstName} ${mentorship.mentee.profile.lastName}`
    : "Mentee";

  const backHref = isMentor ? "/dashboard/mentor" : "/dashboard/mentee";

  return (
    <SessionRateShell role={isMentor ? "MENTOR" : "MENTEE"}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold text-primary">Session feedback</h1>
        </div>

        <SessionRatingFlow
          session={{
            id: sessionId,
            outcome: mentorshipSession.outcome,
            mentorName,
            menteeName,
            userRole: isMentor ? "MENTOR" : "MENTEE",
          }}
        />
      </div>
    </SessionRateShell>
  );
}
