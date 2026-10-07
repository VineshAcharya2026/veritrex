import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RecentPostsSection } from "@/components/feed/RecentPostsSection";
import { ProfileHeader, ProfileSectionCard } from "@/components/profile/ProfileHeader";
import { PublicProfileLayout } from "@/components/profile/PublicProfileLayout";
import { ProfilePublicSidebar } from "@/components/profile/ProfilePublicSidebar";
import { Award, Briefcase, BookOpen } from "lucide-react";

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
      trustScore: { select: { tier: true } },
    },
  });

  if (!user || user.role !== "MENTEE" || !user.menteeProfile) notFound();

  const p = user.menteeProfile;
  const profile = user.profile;
  const trust = user.trustScore;
  const name = profile ? `${profile.firstName} ${profile.lastName}` : "Mentee";
  const tier = (trust?.tier as string) ?? "EMERGING";

  const statusLabel: Record<string, string> = {
    STUDENT: "Student",
    GRADUATE: "Graduate",
    PROFESSIONAL: "Professional",
    ENTREPRENEUR: "Entrepreneur",
    CAREER_BREAK: "Career Break",
    CAREER_SWITCHER: "Career Switcher",
  };

  const headline =
    p.currentDesignation && p.currentInstitution
      ? `${p.currentDesignation} at ${p.currentInstitution}`
      : p.currentRole ||
        (p.currentStatus ? statusLabel[p.currentStatus] ?? p.currentStatus : null);

  const location = p.city
    ? `${p.city}${p.country ? `, ${p.country}` : ""}`
    : null;

  const aboutText =
    p.goals?.trim() ||
    p.successDefinition?.trim() ||
    p.preferredMentorProfile?.trim() ||
    null;

  const modeLabels: Record<string, string> = {
    VIDEO: "Video calls",
    IN_PERSON: "In person",
    ASYNC: "Async messaging",
    GROUP: "Group sessions",
  };

  return (
    <PublicProfileLayout
      header={
        <ProfileHeader
          name={name}
          avatar={profile?.avatar ?? null}
          coverImage={profile?.coverImage ?? null}
          headline={headline}
          summary={aboutText}
          location={location}
          tier={tier}
          userId={id}
        />
      }
      main={
        <>
          {p.careerGoal && (
            <ProfileSectionCard title="Career Goal">
              <p className="text-sm text-primary/70">{p.careerGoal}</p>
            </ProfileSectionCard>
          )}

          {aboutText && !p.careerGoal && (
            <ProfileSectionCard title="About">
              <p className="whitespace-pre-wrap text-sm text-primary/70">{aboutText}</p>
            </ProfileSectionCard>
          )}

          {(p.currentInstitution || p.highestQualification || p.currentStatus) && (
            <ProfileSectionCard title="Education & status">
              <ul className="space-y-2 text-sm text-primary/70">
                {p.currentStatus && (
                  <li>{statusLabel[p.currentStatus] ?? p.currentStatus}</li>
                )}
                {p.highestQualification && (
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted" />
                    {p.highestQualification}
                  </li>
                )}
                {p.currentInstitution && <li>{p.currentInstitution}</li>}
              </ul>
            </ProfileSectionCard>
          )}

          {p.guidanceAreas.length > 0 && (
            <ProfileSectionCard title="Seeking Guidance In">
              <div className="flex flex-wrap gap-2">
                {p.guidanceAreas.map((a: string) => (
                  <span
                    key={a}
                    className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </ProfileSectionCard>
          )}

          {p.skillsToDevelo.length > 0 && (
            <ProfileSectionCard title="Skills to Develop">
              <div className="flex flex-wrap gap-2">
                {p.skillsToDevelo.map((s: string) => (
                  <span
                    key={s}
                    className="rounded-full border border-primary/15 px-3 py-1 text-xs font-medium text-primary/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </ProfileSectionCard>
          )}

          {p.preferredModes.length > 0 && (
            <ProfileSectionCard title="Open to">
              <div className="flex flex-wrap gap-2">
                {p.preferredModes.map((m: string) => (
                  <span
                    key={m}
                    className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs text-primary/80"
                  >
                    {modeLabels[m] ?? m.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </ProfileSectionCard>
          )}

          {p.biggestChallenge && (
            <ProfileSectionCard title="Current Focus">
              <p className="text-sm text-primary/70">{p.biggestChallenge}</p>
            </ProfileSectionCard>
          )}

          <ProfileSectionCard title="Activity">
            <RecentPostsSection authorId={id} hideHeader />
          </ProfileSectionCard>
        </>
      }
      sidebar={
        <>
          <ProfilePublicSidebar
            userId={id}
            tier={tier}
            location={location}
            industry={p.preferredIndustry}
            roleLabel="Mentee on Veritrex"
          />
          <ProfileSectionCard title="Details">
            <ul className="space-y-2 text-sm text-muted">
              {p.yearsOfExperience && (
                <li className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {p.yearsOfExperience} years experience
                </li>
              )}
              {p.languages.length > 0 && (
                <li className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {p.languages.join(", ")}
                </li>
              )}
            </ul>
          </ProfileSectionCard>
        </>
      }
    />
  );
}
