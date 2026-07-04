import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { MapPin, Building2, Briefcase, Target, BookOpen } from "lucide-react";

export default async function PublicMenteeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      menteeProfile: true,
      trustScore: { select: { tier: true, totalScore: true } },
    },
  });

  if (!user || user.role !== "MENTEE" || !user.menteeProfile) notFound();

  const p = user.menteeProfile;
  const profile = user.profile;
  const trust = user.trustScore;
  const name = profile ? `${profile.firstName} ${profile.lastName}` : "Mentee";

  const statusLabel: Record<string, string> = {
    STUDENT: "Student",
    GRADUATE: "Graduate",
    PROFESSIONAL: "Professional",
    ENTREPRENEUR: "Entrepreneur",
    CAREER_BREAK: "Career Break",
    CAREER_SWITCHER: "Career Switcher",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent/10 text-2xl font-bold text-accent">
          {profile?.avatar ? (
            <img src={profile.avatar} alt={name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-primary">{name}</h1>
          <TrustScoreBadge tier={(trust?.tier as any) ?? "EMERGING"} />
          {p.currentDesignation && p.currentInstitution && (
            <p className="text-sm text-muted">
              {p.currentDesignation} at {p.currentInstitution}
            </p>
          )}
          {p.currentStatus && (
            <p className="text-xs text-muted">
              {statusLabel[p.currentStatus] ?? p.currentStatus}
            </p>
          )}
        </div>
      </div>

      <hr className="border-primary/10" />

      {p.careerGoal && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Career Goal</h2>
          <p className="text-sm text-primary/70">{p.careerGoal}</p>
        </section>
      )}

      {p.guidanceAreas.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Seeking Guidance In</h2>
          <div className="flex flex-wrap gap-2">
            {p.guidanceAreas.map((a) => (
              <span key={a} className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {p.skillsToDevelo.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Skills to Develop</h2>
          <div className="flex flex-wrap gap-2">
            {p.skillsToDevelo.map((s) => (
              <span key={s} className="rounded-full border border-primary/15 px-3 py-1 text-xs font-medium text-primary/70">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {p.biggestChallenge && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Biggest Challenge</h2>
          <p className="text-sm text-primary/70">{p.biggestChallenge}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-muted">
        {p.city && (
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{p.city}{p.country ? `, ${p.country}` : ""}</span>
        )}
        {p.preferredIndustry && (
          <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{p.preferredIndustry}</span>
        )}
        {p.yearsOfExperience && (
          <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{p.yearsOfExperience} years</span>
        )}
        {p.languages.length > 0 && (
          <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{p.languages.join(", ")}</span>
        )}
      </div>
    </div>
  );
}
