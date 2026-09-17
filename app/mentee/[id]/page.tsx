import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RecentPostsSection } from "@/components/feed/RecentPostsSection";
import { ProfileHeader, ProfileSectionCard } from "@/components/profile/ProfileHeader";
import { MapPin, Building2, Briefcase, BookOpen } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <ProfileHeader
          name={name}
          avatar={profile?.avatar ?? null}
          coverImage={profile?.coverImage ?? null}
          headline={headline}
          location={location}
          tier={(trust?.tier as string) ?? "EMERGING"}
          userId={id}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            {p.careerGoal && (
              <ProfileSectionCard title="Career Goal">
                <p className="text-sm text-primary/70">{p.careerGoal}</p>
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

            {p.biggestChallenge && (
              <ProfileSectionCard title="Biggest Challenge">
                <p className="text-sm text-primary/70">{p.biggestChallenge}</p>
              </ProfileSectionCard>
            )}

            <ProfileSectionCard title="Activity">
              <RecentPostsSection authorId={id} hideHeader />
            </ProfileSectionCard>
          </div>

          <aside className="space-y-4">
            <ProfileSectionCard title="About">
              <ul className="space-y-2 text-sm text-muted">
                {location && (
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </li>
                )}
                {p.preferredIndustry && (
                  <li className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {p.preferredIndustry}
                  </li>
                )}
                {p.yearsOfExperience && (
                  <li className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {p.yearsOfExperience} years
                  </li>
                )}
                {p.languages.length > 0 && (
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {p.languages.join(", ")}
                  </li>
                )}
                {p.currentStatus && (
                  <li className="text-primary/70">
                    {statusLabel[p.currentStatus] ?? p.currentStatus}
                  </li>
                )}
              </ul>
            </ProfileSectionCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
